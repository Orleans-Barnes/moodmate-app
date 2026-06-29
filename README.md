# MoodMate Backend

Spring Boot + PostgreSQL backend for the MoodMate app: auth, mood check-ins, gamification (tree/streak/XP/leaf wallet/shop), journal, gratitude jar, community, support (counsellor booking, appointments, peer-mentor messaging), wellness hub (articles/events/RSVP), SOS/crisis resources, and Pro subscriptions + leaf-pack purchases via Paystack (test mode).

## Tech stack

- Java 17, Spring Boot 3.5.11 (web, data-jpa, security, validation, webflux-for-WebClient)
- PostgreSQL + Flyway (schema is owned by migrations — `ddl-auto: validate`, never auto-generated)
- JWT auth (jjwt 0.12.6, HS256, stateless)
- Paystack REST API (test/sandbox mode) for billing
- Lombok

## Project layout

One package per domain under `com.moodmate.backend`: `auth`, `checkin`, `wellness` (goals/tree/XP + `GoalEngine`), `wallet` (leaves/shop), `journal`, `gratitude`, `community`, `support`, `hub` (wellness hub), `sos`, `payments` (subscriptions + Paystack), plus shared `security`, `config`, `common/exception`.

## Setup

1. **PostgreSQL** — create a local database:
   ```sql
   CREATE DATABASE moodmate;
   CREATE USER moodmate WITH PASSWORD 'moodmate';
   GRANT ALL PRIVILEGES ON DATABASE moodmate TO moodmate;
   ```
   (Adjust credentials to taste — they just need to match your env vars below.)

2. **Environment variables** — copy `.env.example` to `.env` and fill it in (or export the same variables directly):
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` — Postgres connection.
   - `JWT_SECRET` — 32+ random chars (`openssl rand -base64 48`). The app has a dev-only fallback so it won't crash without one, but never ship that fallback.
   - `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — from your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developers), **test mode** (`sk_test_…` / `pk_test_…`). Payments endpoints work without these set, except actually calling Paystack (checkout/verify), which will throw a clear error until a real test secret key is present.
   - `PAYSTACK_CALLBACK_URL` — where Paystack redirects after checkout (defaults to a mobile deep link).

   Spring Boot doesn't auto-load `.env` files — either `export $(grep -v '^#' .env | xargs)` before running, use a plugin like `spring-dotenv`, or pass `--env-file=.env` if your launcher supports it (e.g. `docker run --env-file`).

3. **Run** (migrations apply automatically on startup via Flyway). You don't need Maven installed — this project includes the Maven Wrapper, which downloads and caches the right Maven version on first run (still needs a **JDK 17** on your machine, with `JAVA_HOME` set):
   ```
   mvnw.cmd spring-boot:run        (Windows)
   ./mvnw spring-boot:run          (macOS/Linux/WSL)
   ```
   If you do have Maven installed already, plain `mvn spring-boot:run` works too. To build a runnable jar instead:
   ```
   mvnw.cmd clean package
   java -jar target\moodmate-backend-1.0.0.jar
   ```

4. **Paystack webhook (local testing)** — Paystack needs a public URL to POST to. Use a tunnel (e.g. `ngrok http 8080`) and set the webhook URL in your Paystack dashboard to `https://<tunnel>/api/payments/webhook`. The endpoint is public (no JWT) because it's authenticated by Paystack's `X-Paystack-Signature` HMAC header instead — see `PaystackSignatureVerifier`. If you don't wire up a webhook at all, payments still complete correctly: the client calls `GET /api/payments/verify/{reference}` right after returning from checkout, which fulfills the transaction itself.

## API overview

All endpoints are under `/api`. Auth is a Bearer JWT (`Authorization: Bearer <token>`) issued by `/api/auth/login` or `/api/auth/signup`, except:
- `/api/auth/**` (issues the token)
- `/api/sos/**` (crisis resources — product rule: never gated behind auth or Pro)
- `/api/payments/webhook` (Paystack signature instead of a JWT)
- `/actuator/health`

| Domain | Base path |
|---|---|
| Auth | `/api/auth` |
| Mood check-ins | `/api/checkins` |
| Gamification (goals/tree) | `/api/wellness` |
| Wallet & shop | `/api/wallet` |
| Journal | `/api/journal` |
| Gratitude jar | `/api/gratitude` |
| Community | `/api/community` |
| Support (counsellors/appointments/messages) | `/api/support` |
| Wellness hub (articles/events) | `/api/hub` |
| SOS / crisis resources | `/api/sos` |
| Subscriptions & payments | `/api/payments` |

## A note on verification

This backend was written and reviewed in an environment that could not actually compile or run it: only a Java 11 JRE was available (no `javac`, and the project requires Java 17), there's no Maven binary, and network access to both Maven Central and the Paystack API was blocked. So nothing here has been built, started, or hit with a real request in that environment — everything was written carefully and re-read by hand (entity ↔ migration column matching, request/response shapes, idempotency logic in `PaymentsService`, the `GoalEngine` streak/XP rules), but **you should run `mvn clean compile` and exercise the endpoints yourself before trusting this in anything real.** If something doesn't compile, it's most likely a small import or type mismatch — flag it and I'll fix it immediately.
