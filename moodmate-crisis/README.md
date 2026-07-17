# moodmate-crisis

No monolith counterpart - this is a new service, added because the frontend already shipped a
full crisis-alert UI (`src/api/crisis.ts`, counsellor/admin screens) with zero backend behind it.

## What it owns

One table, `crisis_alerts`. Created only via the internal endpoint below (never directly by an
end user), and never contains AI/keyword-detection logic itself - that logic lives in the calling
services (moodmate-ai for chat messages, moodmate-journal for journal entries), which each do
their own keyword matching and just report the result here.

## Endpoints

Public (gateway-routed, `/api/crisis/**`, requires COUNSELLOR or ADMIN role via `X-User-Role`):
- `GET /api/crisis/alerts` - list OPEN alerts
- `POST /api/crisis/alerts/{id}` - ACKNOWLEDGE or RESOLVE an alert
- `GET /api/crisis/admin/count` - `{ open: number }` badge count
- `GET /api/crisis/admin/alerts` - every alert, any status (ADMIN only)

Internal (service-to-service only, NOT reachable through the gateway - see
`InternalCrisisAlertController`'s doc comment):
- `POST /internal/crisis/alerts` - called by moodmate-ai and moodmate-journal when their own
  keyword detection matches.

## Port

8100 (see `moodmate-gateway/application.yml`'s `crisis-service` route).
