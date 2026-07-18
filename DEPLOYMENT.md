# Deployment (Docker + nginx + local file storage)

This repository targets a **single VPS** or small cluster with **PostgreSQL**, **Redis**, **local disk** for uploads (bind-mounted volume), **Node API**, **Next.js** frontend, and **nginx** as reverse proxy.

## Prerequisites

- Docker Engine + Docker Compose v2
- TLS certificates (Let’s Encrypt or your CA) for HTTPS in production

## Environment

1. **API (`server`)** — copy `server/.env.example` to `server/.env` for local dev, or pass variables via Compose / secrets in production. Required:
   - `DATABASE_URL`, `REDIS_URL`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SIGNED_URL_SECRET` (≥32 chars each)
   - `CORS_ORIGIN` — comma-separated browser origins (e.g. `https://app.example.com`)
   - `STORAGE_LOCAL_ROOT` — inside Docker use `/data/storage` (matches Compose volume)
   - `PUBLIC_API_BASE_URL` — public origin of the API **without path** (e.g. `https://api.example.com`) so signed download URLs are correct behind TLS and proxies
2. **Frontend** — set `NEXT_PUBLIC_API_URL` to the **browser-visible** API base, e.g. `https://api.example.com/api/v1` if the API is on a subdomain, or `https://yourdomain.com/api/v1` if nginx routes `/api` to the API container.

## Compose (development / staging)

From repo root:

```bash
docker compose up --build
```

- App via nginx: `http://localhost` → frontend; `http://localhost/api/v1/...` → API.
- Run migrations against Postgres: `docker compose exec api npx prisma migrate deploy` (after setting the same `DATABASE_URL` as the container).

## HTTPS

Terminate TLS at nginx (recommended) or at an external load balancer:

- Listen `443 ssl http2;` with `ssl_certificate` / `ssl_certificate_key`.
- Set `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax` (same-site) or `none` with Secure for cross-site SPAs.
- Ensure `PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_API_URL` use `https://`.

## File storage & backup

- Uploads live under `STORAGE_LOCAL_ROOT` (Compose: volume `dms_storage` → `/data/storage`).
- **Backup**: snapshot the volume directory and Postgres together; restore both for consistency.
- Permissions: run the API process as a non-root user in hardened setups; ensure the mount is writable only by that user.

## Health checks

- `GET /health` returns JSON with PostgreSQL and Redis checks (used by orchestrators and load balancers).

## Graceful shutdown

The API process closes HTTP, BullMQ workers, Redis, and Prisma on `SIGINT` / `SIGTERM`.

## Smoke tests after deploy

- `GET /health` → `200` with `checks.postgresql` and `checks.redis` = `ok`
- Login → cookie refresh → call `/api/v1/client/documents`
- Upload a file → download via signed URL
