import os
import json
import tempfile
import shutil
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

import ansible_runner

from app.config import settings
from app.models.job import Job
from app.models.playbook import Playbook
from app.models.inventory import Inventory
from app.models.host import Host
from app.models.credential import Credential
from app.services.encryption import decrypt


def build_inventory_file(inventory: Inventory, hosts: list[Host]) -> str:
    groups: dict[str, list] = {}
    for host in hosts:
        if not host.enabled:
            continue
        g = host.group_name or "all"
        groups.setdefault(g, []).append(host)

    lines = []
    for group, group_hosts in groups.items():
        lines.append(f"[{group}]")
        for h in group_hosts:
            vars_str = ""
            if h.variables:
                try:
                    hv = json.loads(h.variables)
                    vars_str = " ".join(f"{k}={v}" for k, v in hv.items())
                except Exception:
                    pass
            lines.append(f"{h.address} ansible_port={h.port} {vars_str}".strip())
        lines.append("")

    return "\n".join(lines)


def run_job(job_id: int, db: Session) -> None:
    job: Optional[Job] = db.query(Job).filter(Job.id == job_id).first()
    if job is None:
        return

    job.status = "running"
    job.started_at = datetime.now(timezone.utc)
    db.commit()

    playbook: Playbook = db.query(Playbook).filter(Playbook.id == job.playbook_id).first()
    inventory: Inventory = db.query(Inventory).filter(Inventory.id == job.inventory_id).first()
    credential: Credential = db.query(Credential).filter(Credential.id == job.credential_id).first()
    hosts: list[Host] = db.query(Host).filter(Host.inventory_id == inventory.id).all()

    project_dir = tempfile.mkdtemp(prefix=f"job_{job_id}_", dir=settings.ANSIBLE_PROJECTS_DIR)

    try:
        playbook_path = os.path.join(project_dir, playbook.filename)
        with open(playbook_path, "w") as f:
            f.write(playbook.content)

        inventory_content = build_inventory_file(inventory, hosts)
        inventory_path = os.path.join(project_dir, "inventory.ini")
        with open(inventory_path, "w") as f:
            f.write(inventory_content)

        env_vars: dict = {}

        if credential.credential_type == "ssh_password":
            env_vars["ANSIBLE_HOST_KEY_CHECKING"] = "False"
            if credential.username:
                env_vars["ANSIBLE_REMOTE_USER"] = credential.username
            if credential.password_enc:
                env_vars["ANSIBLE_SSH_PASS"] = decrypt(credential.password_enc)

        elif credential.credential_type == "ssh_key":
            env_vars["ANSIBLE_HOST_KEY_CHECKING"] = "False"
            if credential.username:
                env_vars["ANSIBLE_REMOTE_USER"] = credential.username
            if credential.ssh_key_enc:
                key_content = decrypt(credential.ssh_key_enc)
                key_path = os.path.join(project_dir, "ssh_key")
                with open(key_path, "w") as f:
                    f.write(key_content)
                os.chmod(key_path, 0o600)
                env_vars["ANSIBLE_PRIVATE_KEY_FILE"] = key_path

        if credential.become_method:
            env_vars["ANSIBLE_BECOME"] = "True"
            env_vars["ANSIBLE_BECOME_METHOD"] = credential.become_method
            if credential.become_username:
                env_vars["ANSIBLE_BECOME_USER"] = credential.become_username
            if credential.become_password_enc:
                env_vars["ANSIBLE_BECOME_PASS"] = decrypt(credential.become_password_enc)

        extra_vars = None
        if job.extra_vars:
            try:
                extra_vars = json.loads(job.extra_vars)
            except Exception:
                extra_vars = {"raw": job.extra_vars}

        result = ansible_runner.run(
            private_data_dir=project_dir,
            playbook=playbook.filename,
            inventory=inventory_path,
            extravars=extra_vars,
            limit=job.limit or None,
            verbosity=job.verbosity,
            envvars=env_vars,
            quiet=False,
        )

        output_lines = []
        for event in result.events:
            stdout = event.get("stdout", "")
            if stdout:
                output_lines.append(stdout)

        job.output = "\n".join(output_lines) if output_lines else ""
        job.return_code = result.rc
        job.status = "success" if result.rc == 0 else "failed"

    except Exception as exc:
        job.status = "failed"
        job.output = str(exc)
        job.return_code = -1

    finally:
        job.finished_at = datetime.now(timezone.utc)
        db.commit()
        shutil.rmtree(project_dir, ignore_errors=True)
