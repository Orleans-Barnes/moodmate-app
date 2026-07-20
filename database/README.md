# MoodMate — Database

MoodMate's backend is 13 Spring Boot microservices sharing **one Postgres instance**, but each
service owns its **own schema** inside it and manages that schema itself via Flyway. There is no
separate database to create by hand, no shared migration folder to run, and no manual `CREATE
SCHEMA` step — every service creates its own schema and tables automatically the first time it
starts up.

## Quick start

```bash
cd database
docker compose up -d
```

That's it. This starts a single Postgres 17 container (`moodmate-postgres`) on `localhost:5432`
with database `moodmate`, user `moodmate`, password `moodmate` — the defaults every backend
service already expects out of the box (see `backend/*/src/main/resources/application.yml`'s
`spring.datasource.url`). No further setup is needed before starting any backend service; each one
runs its own Flyway migrations against its own schema on boot.

To stop it later: `docker compose down` (keeps your data). To wipe everything and start clean:
`docker compose down -v`.

## Why one Postgres instance, many schemas

This keeps local dev simple (one container, one set of credentials for everyone) while still
respecting microservice boundaries in the actual schema design — no service reads or writes
another service's tables directly except for a couple of narrowly documented, intentional
exceptions (e.g. `moodmate-admin` reading other schemas read-only for cross-service reporting).
This is a deliberate, documented trade-off for a project this size — not the recommended pattern
for a service mesh at real scale, where each service would typically get its own database instance.

## Schema-per-service map

| Service | Port | Schema |
|---|---|---|
| moodmate-gateway | 8080 | *(routes only, no DB)* |
| moodmate-auth | 8091 | `auth` |
| moodmate-mood | 8092 | `mood` |
| moodmate-support | 8093 | `support` |
| moodmate-community | 8094 | `community` |
| moodmate-wellness | 8095 | `wellness` |
| moodmate-wallet | 8096 | `wallet` |
| moodmate-journal | 8097 | `journal` |
| moodmate-gamification | 8098 | `gamification` |
| moodmate-admin | 8099 | `admin` |
| moodmate-crisis | 8100 | `crisis` |
| moodmate-ai | 8101 | `ai` |
| moodmate-notifications | 8102 | `notifications` |

## No-conflict guarantee for the team

Every teammate runs their **own** local Postgres container from this same `docker-compose.yml` —
nobody shares a database with anyone else, so there's no way for one person's local data or schema
state to affect another's. What this setup *does* guarantee is that everyone's local schema always
matches what the current code expects: since every service applies its own Flyway migrations on
every startup, pulling the latest code and restarting a service is enough to pick up any new
migration automatically — there's no "did you remember to run the SQL script" step to forget or get
out of sync on.

## Resetting a single service's data (not the whole database)

Flyway migrations are additive and don't provide an easy single-schema wipe. If you need to reset
just one service's data during development, the simplest safe option is:

```sql
DROP SCHEMA <schema_name> CASCADE;
```

connected to the `moodmate` database (e.g. via `docker exec -it moodmate-postgres psql -U moodmate
-d moodmate`), then restart that one service — Flyway will recreate the schema and re-run every
migration from scratch (`create-schemas: true`, `baseline-on-migrate: true` in that service's
`application.yml`).

## Secrets

The database itself has no real secrets in this local setup — `moodmate`/`moodmate` is a
deliberately simple local-dev-only credential pair, matching every service's own `${DB_USERNAME:
moodmate}` / `${DB_PASSWORD:moodmate}` defaults. Do not reuse these credentials anywhere outside
local development. Real per-developer secrets (Groq/Gemini API keys, JWT signing secret, Paystack
keys, mail credentials) live in each service's own environment variables / local `.env`, which are
gitignored and were never part of this `database/` folder.
