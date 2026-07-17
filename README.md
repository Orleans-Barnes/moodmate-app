# MoodMate Backend

Spring Boot + PostgreSQL **microservices** backend for the MoodMate app: auth, mood check-ins,
gamification (tree/streak/XP/leaf wallet/shop/streak shield), journal + gratitude jar (with crisis
keyword detection), community, support (counsellor booking, appointments, peer-mentor messaging,
SOS resources), wellness hub (articles/events/RSVP), AI chat + insights (Groq), crisis-alert
triage, admin dashboard, and Pro subscriptions + leaf-pack purchases via Paystack (test mode).

This started as a monolith (`com.moodmate.backend`) and was fully split into 12 independent Spring
Boot services, one Postgres schema per service, fronted by a single Spring Cloud Gateway. Each
service still has its own `README.md` for anything specific to it.

## Tech stack

- Java 17, Spring Boot 3.5.11, Spring Cloud Gateway (2025.0.0 / Northfields)
- PostgreSQL + Flyway per service (`ddl-auto: validate` — schema is owned by migrations, never
  auto-generated). One shared Postgres instance, one schema per service (`?currentSchema=<name>`).
- JWT auth (jjwt 0.12.6, HS256, stateless) — validated **only** at the gateway; every downstream
  service trusts the `X-User-Id`/`X-User-Role` headers the gateway injects rather than
  re-validating the token itself.
- Groq (OpenAI-compatible chat completions API) for AI chat and insights narratives.
- Paystack REST API (test/sandbox mode) for billing.
- Gmail SMTP (`spring-boot-starter-mail`) for password-reset emails.
- Lombok.

## Services

| Service | Port | Owns | Notes |
|---|---|---|---|
| `moodmate-gateway` | 8080 | — | Single public entry point. Routes `/api/**` by path, validates JWTs, injects `X-User-Id`/`X-User-Role`. |
| `moodmate-auth` | 8091 | `auth` schema | Signup/login/guest, admin-setup, forgot/reset password, profile, avatar upload, push tokens. |
| `moodmate-mood` | 8092 | `mood` schema | Check-ins, mood trend/analytics. |
| `moodmate-support` | 8093 | `support` schema | Counsellors, appointments, conversations/messages, SOS resources (public, unauthenticated). |
| `moodmate-community` | 8094 | `community` schema | Posts, reactions. |
| `moodmate-wellness` | 8095 | `wellness` schema | Daily goals, tree XP/streak, streak shield, wellness hub (articles/events/RSVP). |
| `moodmate-wallet` | 8096 | `wallet` schema | Leaf balance, tree skins, subscriptions, Paystack checkout/webhook. |
| `moodmate-journal` | 8097 | `journal` schema | Journal entries (with crisis keyword detection), gratitude jar. |
| `moodmate-gamification` | 8098 | `gamification` schema | Achievements, missions. |
| `moodmate-admin` | 8099 | `admin` schema (+ read-only cross-schema reporting) | Dashboard stats, counsellor whitelist. |
| `moodmate-crisis` | 8100 | `crisis` schema | Crisis-alert triage (counsellor/admin), created internally by `moodmate-ai`/`moodmate-journal`. |
| `moodmate-ai` | 8101 | `ai` schema | AI chat (Groq) with crisis-keyword detection, `/api/insights`. |

Two cross-service exceptions to "each service only touches its own schema," both deliberate and
documented in the owning service's code: `moodmate-admin` does read-only cross-schema SQL for
reporting (see its `AdminService` doc comment), and every service-to-service call otherwise goes
over HTTP to a small set of `/internal/**` endpoints that are not reachable through the gateway
(only reachable by another service calling the target directly on its own port).

## Setup

1. **PostgreSQL** — one database, one role, shared by every service (each gets its own schema
   automatically via Flyway on first startup — `create-schemas: true`, you don't create schemas
   yourself):
   ```sql
   CREATE DATABASE moodmate;
   CREATE USER moodmate WITH PASSWORD 'moodmate';
   GRANT ALL PRIVILEGES ON DATABASE moodmate TO moodmate;
   ```

2. **Environment variables** — set these as real env vars in the shell you'll run the services
   from (`set VAR=value` on Windows), never hardcoded into any file:

   | Variable | Used by | Required for |
   |---|---|---|
   | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | every service | Postgres connection (has local-dev defaults) |
   | `JWT_SECRET` | gateway + auth | Must be byte-for-byte identical in both. Has a dev-only fallback; never ship it. |
   | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | wallet | Checkout/webhook/verify (`sk_test_…`/`pk_test_…` from your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developers)) |
   | `MAIL_USERNAME`, `MAIL_PASSWORD` | auth | Forgot/reset-password emails (Gmail address + **App Password with spaces removed**) |
   | `GROQ_API_KEY` | ai | AI chat + insights narrative (from [console.groq.com](https://console.groq.com)) |
   | `GROQ_MODEL` | ai | Optional override if the default (`llama-3.3-70b-versatile`) is ever deprecated on Groq's side |
   | `PUBLIC_BASE_URL` | auth | Must match the gateway's externally-reachable address (same IP the frontend's `BACKEND_BASE_URL` uses) — embedded into uploaded avatar URLs so a phone can actually load them |
   | `AVATAR_STORAGE_DIR` | auth | Optional, defaults to `./uploads/avatars` relative to wherever auth-service runs |
   | `SEED_DEMO_ACCOUNTS`, `SEED_ADMIN_PASSWORD` | auth | Optional — off by default; see `moodmate-auth/DataInitializer`'s doc comment |

3. **Run everything at once**: `start-all.bat` opens all 12 services, each in its own titled
   window, and reads `JAVA_HOME`/the Maven Wrapper automatically. `stop-all.bat` stops them all by
   port. Run a single service the same way `start-all.bat` does:
   ```
   mvnw -pl moodmate-<name> spring-boot:run
   ```
   To just compile everything without running it: `mvnw compile` (or `mvnw -pl <module> -am compile`
   for one service and its dependencies).

4. **Paystack webhook (local testing)** — needs a public URL. Use a tunnel (e.g. `ngrok http 8080`)
   and set the webhook URL in your Paystack dashboard to `https://<tunnel>/api/payments/webhook`.
   That route is public at the gateway (no JWT) because it's authenticated by Paystack's
   `X-Paystack-Signature` HMAC header instead. Without a webhook wired up, payments still complete
   correctly — the client calls `GET /api/payments/verify/{reference}` right after checkout, which
   fulfills the transaction on its own.

## API overview

Everything goes through the gateway at `http://<your-ip>:8080`. Auth is a Bearer JWT
(`Authorization: Bearer <token>`) issued by `/api/auth/login`, `/signup`, `/guest`, or
`/admin-setup`, except:
- `/api/auth/**` (issues the token)
- `/api/sos/**` (crisis resources — product rule: never gated behind auth or Pro, see
  `moodmate-support/SosController`)
- `/media/**` (uploaded avatar images)
- `/api/payments/webhook` (Paystack signature instead of a JWT)
- `/actuator/health` on each service

| Domain | Base path | Service |
|---|---|---|
| Auth | `/api/auth` | moodmate-auth |
| User profile / avatar | `/api/users`, `/media` | moodmate-auth |
| Push tokens | `/api/push` | moodmate-auth |
| Mood check-ins | `/api/checkins` | moodmate-mood |
| Support (counsellors/appointments/messages) | `/api/support` | moodmate-support |
| SOS / crisis resources | `/api/sos` | moodmate-support |
| Community | `/api/community` | moodmate-community |
| Wellness (goals/tree/streak/streak shield) + hub | `/api/wellness`, `/api/hub` | moodmate-wellness |
| Wallet & shop, subscriptions & payments | `/api/wallet`, `/api/payments` | moodmate-wallet |
| Journal, gratitude jar | `/api/journal`, `/api/gratitude` | moodmate-journal |
| Gamification (achievements/missions) | `/api/gamification` | moodmate-gamification |
| Admin dashboard | `/api/admin` | moodmate-admin |
| Crisis-alert triage | `/api/crisis` | moodmate-crisis |
| AI chat, insights | `/api/ai`, `/api/insights` | moodmate-ai |

## A note on verification

Every service in this repo has been compiled successfully via the real Maven Wrapper
(`mvnw compile` at the root, and `mvnw -pl <module> -am compile` per-service during development) —
unlike the original monolith, nothing here is unverified-by-construction. What has **not** yet
been done is a full runtime pass: starting every service together, pointing the mobile app at the
gateway, and clicking through signup → check-in → journal → community → wallet/Paystack →
gamification → admin → AI chat end to end. Do that before trusting any of this in front of anyone
else, and flag the exact error and the screen/action that triggered it if anything breaks.
