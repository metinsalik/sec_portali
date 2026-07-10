---
name: infra-expert
description: MANDATORY production-grade Docker and PostgreSQL rules. Use for environment setup, container orchestration, and any infrastructure tasks. Docker is the absolute primary environment.
---

# Infrastructure & Docker First Policy

## 🚨 ABSOLUTE RULE: Docker Integration
- **DOCKER IS MANDATORY:** No code should be written or run outside of the Docker environment. 
- All development, testing, and production workflows must be containerized.
- Every new service or module must be reflected in `docker-compose.yml`.

## Docker Compose Standards
- **Healthcheck first:** Every database or external service must have a healthcheck using `pg_isready` or similar.
- **Service Dependency:** Use `depends_on` with `condition: service_healthy` to ensure backend doesn't start before DB.
- **Port Mapping:** Host ports (e.g., `3005:3005`, `5432:5432`) must be fixed and persistent.
- **Environment:** Always use `.env` files. Never hardcode sensitive data in Dockerfiles.
- **Volumes:** Use named volumes (e.g., `postgres_data`) for persistence.

## PostgreSQL Configuration
- **Connection:** `DATABASE_URL` format: `postgresql://user:pass@postgres:5432/db`.
- **Hostname:** Always use service names (e.g., `postgres`, `backend`) instead of `localhost`.
- **Migrations:** Always run Prisma migrations inside the container using `docker-compose exec`.

## Production & Security
- **Rootless:** Never run containers as root user.
- **Multi-stage:** Use multi-stage builds for frontend (Vite build) and backend to keep images small.
- **Isolation:** Use internal Docker networks to isolate DB from public access.