# MoodMate — Admin Service

Admin-only health pulse and analytics dashboard endpoints. No monolith counterpart - the monolith
never had an admin analytics surface at all.

## Endpoints (`/api/admin`, port 8099, all require `X-User-Role: ADMIN`)

| Method | Path                       | Description                                          |
|--------|----------------------------|-------------------------------------------------------|
| GET    | `/health-pulse`            | Snapshot: total users, active-today, check-ins today, pending counsellor requests, flagged posts, configured SOS resources, 30-day avg stress. |
| GET    | `/analytics/checkins?days=` | Daily check-in count + average stress over N days.    |
| GET    | `/analytics/moods`         | Mood/emotion distribution over the last 30 days.       |
| GET    | `/analytics/institutions`  | User count grouped by institution.                     |

## Why this service reads other services' tables directly

Every other service in this system follows one rule: never read another service's schema
directly, only through its `/internal/**` endpoints (see `moodmate-auth`'s `InternalUserController`
or `moodmate-wallet`'s `InternalWalletController`) or the gateway. This service is a deliberate,
narrow exception to that rule - see the class-level comment on `AdminService` for the full
reasoning. Short version: it's read-only, it's for an admin dashboard rather than a user-facing
request path, and every service still lives on the same shared Postgres instance, so
schema-qualified SQL (`auth.users`, `mood.mood_checkins`, `support.counsellors`,
`support.sos_resources`, `community.community_posts`) works. If any of those services ever moved
to a genuinely separate database, this would need to become real internal HTTP calls instead.
