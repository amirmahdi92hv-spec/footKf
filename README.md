# FootKf

Persian-first (RTL) football platform. Next.js 15 + TypeScript, SQLite via libSQL (local file in dev, Turso in production).

## Run
    cp .env.example .env.local   # fill values
    npm install && npm run db:migrate && npm run dev
    npm test && npm run typecheck && npm run build

## Architecture
- `src/lib/providers`: provider adapters + resilient HTTP (cache, retry/backoff, per-day budget). Only `football-data` exists today.
- `src/lib/sync`: idempotent upserts via `provider_mappings`; field-level `manual_overrides` always win over sync; job locks and logs.
- `src/app/admin`: signed-cookie auth (middleware + server-action re-check), usage/jobs/audit views, manual sync.
- `/api/cron/sync`: protected by `CRON_SECRET`; triggered by `.github/workflows/sync.yml`.

## Provider limits (checked Nov 2026; re-verify before relying)
- football-data.org free: 10 req/min, limited competition set, live data delayed (~5 min per community reports), non-commercial use.
- API-Football free: 100 req/day, all endpoints (adapter not built yet).
- Turso free: 5 GB, 500M rows read, 10M rows written per month.
- Hosting is undecided: check the host's free-tier commercial-use terms before launch.

## Not built yet
Match detail/events/lineups, team/player pages, transfers, news ingestion, search, favorites/users, admin CRUD + CSV import, second provider.
