# Deployment (Docker + nginx + local VPS file storage)

This repository targets a **single VPS** with **PostgreSQL**, **Redis**, **local disk** for uploads (no S3), **Node API**, **Next.js** frontend, and **nginx** as reverse proxy.

## Deploy checklist — change these 4 vars

Point everything at your VPS IP or domain (examples use `http://YOUR_VPS_IP`):

| Variable | Where | Example (local) | Example (VPS) |
|----------|--------|-----------------|---------------|
| `PUBLIC_APP_BASE_URL` | API | `http://localhost:3000` | `http://YOUR_VPS_IP` |
| `PUBLIC_API_BASE_URL` | API | `http://localhost:4000` | `http://YOUR_VPS_IP` |
| `CORS_ORIGIN` | API | `http://localhost:3000` | `http://YOUR_VPS_IP` |
| `NEXT_PUBLIC_API_URL` | Frontend build | `http://localhost:4000/api/v1` | `http://YOUR_VPS_IP/api/v1` |

Also set `NEXT_PUBLIC_APP_URL` to the same origin as `PUBLIC_APP_BASE_URL` (share links).

Behind nginx on one host, app and API often share the same origin (`http://YOUR_VPS_IP`); then:

```bash
PUBLIC_APP_BASE_URL=http://YOUR_VPS_IP
PUBLIC_API_BASE_URL=http://YOUR_VPS_IP
CORS_ORIGIN=http://YOUR_VPS_IP
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP/api/v1
NEXT_PUBLIC_APP_URL=http://YOUR_VPS_IP
```

## Prerequisites

- Docker Engine + Docker Compose v2
- TLS certificates (Let’s Encrypt or your CA) for HTTPS in production

## Environment

1. **API (`server`)** — copy `server/.env.example` to `server/.env` for local dev, or pass variables via Compose / secrets in production. Required:
   - `DATABASE_URL`, `REDIS_URL`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SIGNED_URL_SECRET` (≥32 chars each)
   - `CORS_ORIGIN`, `PUBLIC_APP_BASE_URL`, `PUBLIC_API_BASE_URL`
   - `STORAGE_LOCAL_ROOT` — inside Docker use `/data/storage` (matches Compose volume)
   - `BILLING_ENABLED` — default `false` (subscriptions UI gated / free tier)
2. **Frontend** — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BILLING_ENABLED`

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
- Ensure `PUBLIC_APP_BASE_URL`, `PUBLIC_API_BASE_URL`, and `NEXT_PUBLIC_*` use `https://`.

## File storage & backup (VPS disk only)

- Uploads live under `STORAGE_LOCAL_ROOT` (Compose: volume `dms_storage` → `/data/storage`).
- **No S3 / cloud object storage** — file bytes stay on the VPS; Postgres stores metadata only.
- **Backup**: snapshot the volume directory and Postgres together; restore both for consistency.
- Permissions: run the API process as a non-root user in hardened setups; ensure the mount is writable only by that user.

## Billing

- `BILLING_ENABLED=false` / `NEXT_PUBLIC_BILLING_ENABLED=false` keeps the product free and disables subscription actions.
- Flip both to `true` later when a payment provider is wired; the admin Subscriptions page shell is retained.

## Health checks

- `GET /health` returns JSON with PostgreSQL and Redis checks (used by orchestrators and load balancers).

## Graceful shutdown

The API process closes HTTP, BullMQ workers, Redis, and Prisma on `SIGINT` / `SIGTERM`.

## Smoke tests after deploy

- `GET /health` → `200` with `checks.postgresql` and `checks.redis` = `ok`
- Login → cookie refresh → call `/api/v1/client/documents`
- Upload a file → download via signed URL
- Delete a document → storage file and DB row removed
