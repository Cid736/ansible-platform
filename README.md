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

The application has **no compiled-in default password**. You must set all three variables in `.env` before the first `docker compose up`:

| Variable | Description |
|---|---|
| `FIRST_SUPERUSER` | Admin username (default: `admin`) |
| `FIRST_SUPERUSER_EMAIL` | Admin e-mail |
| `FIRST_SUPERUSER_PASSWORD` | **Required** — strong password, min 16 chars |

## Security

### Mandatory pre-deployment checklist

- [ ] Copy `.env.example` to `.env` and fill in **every** `CHANGE_ME` value
- [ ] Generate `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- [ ] Generate `ENCRYPTION_KEY`: `docker run --rm python:3.12-slim sh -c "pip install cryptography -q && python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"`
- [ ] Set a strong `POSTGRES_PASSWORD` (not `ansible`)
- [ ] Set a strong `FIRST_SUPERUSER_PASSWORD` (not `admin123`)
- [ ] Set `CORS_ORIGINS` to your actual front-end origin(s) (not `*`)
- [ ] Keep `ALLOW_REGISTRATION=False` unless public sign-up is intentional
- [ ] Do **not** expose ports `5432` (PostgreSQL) or `6379` (Redis) to the public internet — both are internal-only in `docker-compose.yml`
- [ ] Remove the `./backend:/app` source bind-mount from `docker-compose.yml` before production deployment

### Security architecture

| Concern | Implementation |
|---|---|
| Authentication | JWT Bearer tokens (HS256), 60-minute expiry |
| Passwords | bcrypt hashed, never stored or returned in plain text |
| Credential secrets | AES-128 Fernet symmetric encryption at rest |
| Authorisation | Per-resource owner check + superuser role |
| CORS | Explicit origin allowlist; wildcard `*` with credentials is rejected |
| Rate limiting | Login endpoint: 10 requests / minute per IP (slowapi) |
| Playbook path traversal | Filename sanitised to `[A-Za-z0-9_-]+.(yml\|yaml)` before use in `os.path.join` |
| Inventory INI injection | Host variables written to `host_vars/` YAML files, not inlined into INI |
| WebSocket authorisation | Token validated + ownership check before streaming job output |
| DB / Redis exposure | Both services have no host port bindings |

### Reporting a vulnerability

Open a private GitHub Security Advisory or e-mail the maintainer directly.

## Usage

1. **Inventories** → create an inventory → add hosts (IP, port, group)
2. **Credentials** → add SSH credential (password or private key)
3. **Playbooks** → write or upload a `.yml` playbook
4. **Jobs** → Launch → select playbook + inventory + credential → run
5. Watch live output in the job detail view

## Environment variables

See `.env.example` for the full list with generation commands. Key variables:

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | JWT signing key — generate with `secrets.token_urlsafe(64)` |
| `ENCRYPTION_KEY` | Yes | Fernet key for credential secrets — generate with `Fernet.generate_key()` |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `FIRST_SUPERUSER_PASSWORD` | Yes | Initial admin password |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins (e.g. `https://ansible.example.com`) |
| `ALLOW_REGISTRATION` | No | `False` (default) disables public self-registration |

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

La aplicación **no tiene contraseña predeterminada compilada**. Debes establecer las tres variables en `.env` antes del primer `docker compose up`:

| Variable | Descripción |
|---|---|
| `FIRST_SUPERUSER` | Usuario admin (por defecto: `admin`) |
| `FIRST_SUPERUSER_EMAIL` | Email del admin |
| `FIRST_SUPERUSER_PASSWORD` | **Obligatorio** — contraseña fuerte, mínimo 16 caracteres |

## Seguridad

### Lista de verificación obligatoria antes de desplegar

- [ ] Copiar `.env.example` a `.env` y rellenar **todos** los valores `CHANGE_ME`
- [ ] Generar `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- [ ] Generar `ENCRYPTION_KEY`: `docker run --rm python:3.12-slim sh -c "pip install cryptography -q && python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"`
- [ ] Establecer `POSTGRES_PASSWORD` fuerte (no `ansible`)
- [ ] Establecer `FIRST_SUPERUSER_PASSWORD` fuerte (no `admin123`)
- [ ] Establecer `CORS_ORIGINS` con tus orígenes reales (no `*`)
- [ ] Mantener `ALLOW_REGISTRATION=False` salvo que el registro público sea intencional
- [ ] No exponer los puertos `5432` (PostgreSQL) ni `6379` (Redis) a Internet — son internos en `docker-compose.yml`
- [ ] Eliminar el bind-mount `./backend:/app` de `docker-compose.yml` antes de producción

### Arquitectura de seguridad

| Aspecto | Implementación |
|---|---|
| Autenticación | JWT Bearer (HS256), expiración 60 minutos |
| Contraseñas | Hash bcrypt, nunca almacenadas ni devueltas en claro |
| Secretos de credenciales | Cifrado Fernet (AES-128) en base de datos |
| Autorización | Comprobación de propietario por recurso + rol superusuario |
| CORS | Lista de orígenes explícita; `*` con credenciales rechazado |
| Rate limiting | Login: 10 peticiones / minuto por IP (slowapi) |
| Path traversal en playbooks | Nombre de archivo validado contra `[A-Za-z0-9_-]+.(yml\|yaml)` |
| Inyección en inventario INI | Variables de host escritas en `host_vars/` YAML, no embebidas en línea INI |
| Autorización WebSocket | Token validado + comprobación de propietario antes de emitir output |
| Exposición DB / Redis | Sin binding de puertos al host |

## Uso

1. **Inventories** → crear inventario → añadir hosts (IP, puerto, grupo)
2. **Credentials** → añadir credencial SSH (contraseña o clave privada)
3. **Playbooks** → escribir o subir un playbook `.yml`
4. **Jobs** → Launch → seleccionar playbook + inventario + credencial → ejecutar
5. Ver la salida en tiempo real en el detalle del job

## Variables de entorno

Consulta `.env.example` para la lista completa con comandos de generación. Variables clave:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SECRET_KEY` | Sí | Clave de firma JWT — generar con `secrets.token_urlsafe(64)` |
| `ENCRYPTION_KEY` | Sí | Clave Fernet para secretos de credenciales — generar con `Fernet.generate_key()` |
| `POSTGRES_PASSWORD` | Sí | Contraseña de PostgreSQL |
| `FIRST_SUPERUSER_PASSWORD` | Sí | Contraseña del admin inicial |
| `CORS_ORIGINS` | Sí | Orígenes permitidos separados por coma (ej. `https://ansible.ejemplo.com`) |
| `ALLOW_REGISTRATION` | No | `False` (por defecto) deshabilita el autoregistro público |

## Changelog

**v1.0.0** — 2026-06-25
- Primera versión: inventarios, hosts, playbooks, credenciales, jobs, salida en vivo WebSocket, autenticación JWT, cifrado Fernet de credenciales, ejecución asíncrona con Celery
