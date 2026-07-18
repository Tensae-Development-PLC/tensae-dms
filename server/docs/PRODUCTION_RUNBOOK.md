# Phase 1 Production Runbook

## Migration Safety

1. Run `npm run prisma:migrate:status` in CI and block deploy if drift is detected.
2. Run `npm run prisma:migrate:deploy` during deployment before app pods roll.
3. Run `npm run prisma:seed` after migrations (safe to rerun; seed is idempotent).
4. Run `npx prisma validate` and `npx prisma format --check` in CI for schema consistency.

## Rollback Strategy

1. If deployment fails after a migration, immediately rollback the app artifact first.
2. For destructive migrations, use expand-and-contract:
   - deploy additive columns/tables first
   - backfill data
   - switch reads/writes
   - remove old columns in a later release
3. Keep a hot backup before each production migration window.
4. For emergency rollback of schema shape, apply a dedicated backward migration; do not manually edit production tables.

## Redis/Queue Recovery

1. Ensure Redis persistence (AOF/RDB) is enabled.
2. Dead-letter queue (`dead-letter`) should be monitored and drained with replay tooling.
3. Keep queue workers separate from API nodes for horizontal scaling.
