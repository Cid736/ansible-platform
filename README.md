<p align="center">
  <a href="#english">🇬🇧 English</a> &nbsp;·&nbsp; <a href="#español">🇪🇸 Español</a>
</p>

---

<a name="english"></a>

# Ansible Platform

AWX-style web platform for managing Ansible inventories, playbooks, credentials and job execution — fully self-hosted with Docker.

## Stack

Python · FastAPI · PostgreSQL · SQLAlchemy · Celery · Redis · React · Vite · Tailwind CSS · Docker

## Features

- **Inventories & Hosts** — create server groups, add hosts with IP/port/variables, enable/disable without deleting
- **Credentials** — store SSH passwords, private keys and privilege escalation settings, encrypted at rest with Fernet
- **Playbooks** — write YAML inline in the editor or upload `.yml` files
- **Job execution** — launch playbooks against an inventory with a credential; live output via WebSocket
- **Job history** — full output saved per execution with status, return code and timestamps
- **Users** — create additional users, assign/revoke superuser permissions
- **REST API** — full Swagger UI at `/docs`

## Setup

```bash
git clone https://github.com/Cid736/ansible-platform
cd ansible-platform

cp .env.example .env
# Generate ENCRYPTION_KEY and set it in .env:
# docker run --rm python:3.12-slim sh -c "pip install cryptography -q && python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"

docker compose up --build -d
```

Open `http://localhost:3000`

## Default credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

> Change these in `.env` before exposing to a network (`FIRST_SUPERUSER_PASSWORD`).

## Usage

1. **Inventories** → create an inventory → add hosts (IP, port, group)
2. **Credentials** → add SSH credential (password or private key)
3. **Playbooks** → write or upload a `.yml` playbook
4. **Jobs** → Launch → select playbook + inventory + credential → run
5. Watch live output in the job detail view

## Environment variables

```env
POSTGRES_USER=ansible
POSTGRES_PASSWORD=ansible
POSTGRES_DB=ansible_platform
SECRET_KEY=change-this-in-production
ENCRYPTION_KEY=<generate with Fernet>
FIRST_SUPERUSER=admin
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin123
```

## Changelog

**v1.0.0** — 2026-06-25
- Initial release: inventories, hosts, playbooks, credentials, jobs, WebSocket live output, JWT auth, Fernet credential encryption, Celery async execution

---

<a name="español"></a>

# Ansible Platform

Plataforma web estilo AWX para gestionar inventarios, playbooks, credenciales y ejecuciones Ansible — completamente self-hosted con Docker.

## Stack

Python · FastAPI · PostgreSQL · SQLAlchemy · Celery · Redis · React · Vite · Tailwind CSS · Docker

## Funcionalidades

- **Inventarios y hosts** — grupos de servidores, hosts con IP/puerto/variables, activar/desactivar sin borrar
- **Credenciales** — contraseñas SSH, claves privadas y escalada de privilegios, cifradas en base de datos con Fernet
- **Playbooks** — escribe YAML directamente en el editor o sube archivos `.yml`
- **Ejecución de jobs** — lanza playbooks contra un inventario con una credencial; salida en tiempo real vía WebSocket
- **Historial de jobs** — output completo guardado por ejecución con estado, código de retorno y timestamps
- **Usuarios** — crea usuarios adicionales, asigna/revoca permisos de superusuario
- **API REST** — Swagger UI completo en `/docs`

## Instalación

```bash
git clone https://github.com/Cid736/ansible-platform
cd ansible-platform

cp .env.example .env
# Genera ENCRYPTION_KEY y ponla en .env:
# docker run --rm python:3.12-slim sh -c "pip install cryptography -q && python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"

docker compose up --build -d
```

Abre `http://localhost:3000`

## Credenciales por defecto

| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `admin123` |

> Cámbialas en `.env` antes de exponer en red (`FIRST_SUPERUSER_PASSWORD`).

## Uso

1. **Inventories** → crear inventario → añadir hosts (IP, puerto, grupo)
2. **Credentials** → añadir credencial SSH (contraseña o clave privada)
3. **Playbooks** → escribir o subir un playbook `.yml`
4. **Jobs** → Launch → seleccionar playbook + inventario + credencial → ejecutar
5. Ver la salida en tiempo real en el detalle del job

## Variables de entorno

```env
POSTGRES_USER=ansible
POSTGRES_PASSWORD=ansible
POSTGRES_DB=ansible_platform
SECRET_KEY=change-this-in-production
ENCRYPTION_KEY=<generar con Fernet>
FIRST_SUPERUSER=admin
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=admin123
```

## Changelog

**v1.0.0** — 2026-06-25
- Primera versión: inventarios, hosts, playbooks, credenciales, jobs, salida en vivo WebSocket, autenticación JWT, cifrado Fernet de credenciales, ejecución asíncrona con Celery
