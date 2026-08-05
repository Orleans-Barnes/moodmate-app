# MoodMate

AI-powered mental wellness mobile app for university students in Ghana. Mood tracking,
journaling, gratitude, a gamified "wellness tree," breathing/grounding exercises, peer support,
professional counselling (with secure video sessions), community, and an AI chat companion with
built-in crisis-detection safety guardrails.

This repository is a **monorepo**: the mobile frontend and the entire backend live together here,
plus everything needed to run a local database. There is nothing else to clone.

```
moodmate-app/
├── src/                → React Native (Expo + TypeScript) frontend — see below
├── App.tsx, app.json, package.json, ...
├── backend/            → 13 Spring Boot microservices + API gateway — see backend/README.md
└── database/           → docker-compose for local Postgres — see database/README.md
```

## Tech stack

- **Frontend:** React Native + Expo (SDK 54) + TypeScript, React Navigation v7, Zustand for state.
- **Backend:** Java 17, Spring Boot 3.5, Spring Cloud Gateway, PostgreSQL, Flyway migrations,
  JWT authentication, one microservice per domain (auth, mood, journal, support/counselling,
  community, wellness, wallet, gamification, admin, crisis, AI chat, notifications) behind a single
  API gateway.
- **Database:** One shared local Postgres instance, one schema per microservice, run via Docker.

## Getting the whole stack running locally

You need three things running at once: the database, the backend services (at minimum the
gateway plus whichever services the screen you're testing needs), and the Expo app.

### 1. Database

```bash
cd database
docker compose up -d
```

See [`database/README.md`](./database/README.md) for the full explanation (schema-per-service map,
port list, how to reset a single service's data). No manual schema setup is needed — every backend
service creates its own schema automatically via Flyway the first time it starts.

### 2. Backend

Each microservice is a normal Maven module. From the `backend/` folder:

```bash
cd backend/moodmate-<service-name>
../mvnw.cmd spring-boot:run        # Windows
../mvnw spring-boot:run            # macOS/Linux
```

**Do not run `mvnw.cmd -pl moodmate-<service> -am spring-boot:run` from the `backend/` root** —
because `backend/pom.xml` is a multi-module aggregator (`packaging: pom`, no `mainClass`), Maven's
reactor tries to run the bare `spring-boot:run` goal against the parent project first and fails
before it ever reaches your service. Always `cd` into the specific service's own folder first, as
shown above.

You always need `moodmate-gateway` running (it's what the frontend actually talks to — every
other service also needs to be reachable through it, not called directly). Beyond that, only start
the services relevant to what you're working on. See [`backend/README.md`](./backend/README.md)
for the full service list, ports, and architecture notes.

### 3. Frontend

```bash
npm install
npm start
```

Then scan the QR code with Expo Go, or see the frontend section below for other ways to run it
(tunnel mode, EAS build, native run, web preview).

## Environment variables / secrets

Every backend service reads real secrets (JWT signing key, database credentials, AI provider API
keys, payment provider keys, mail credentials) from environment variables with safe local-dev
defaults baked in — nothing is hardcoded, and no real secret is committed to this repo. Each
service's own `application.yml` documents exactly which `${VAR_NAME:default}` it reads. If you
need a real third-party key (e.g. an actual Groq/Gemini key for AI chat, or a real Paystack key
for payments), set it as an environment variable before starting that service — ask a teammate for
the shared dev keys rather than committing your own.

**Never commit a `start.bat`, `.env`, or any file containing a real API key or password** — this
is explicitly called out in `backend/.gitignore` after a real key was accidentally committed once
in an earlier version of this project.

## Architecture note: microservices behind one gateway

The backend is genuinely split into 13 independently-runnable Spring Boot services (not a
monolith with folders) — see [`backend/README.md`](./backend/README.md) for the full breakdown.
The frontend and any other client should only ever talk to the gateway (`localhost:8080`), which
routes to the right service and is the only place JWT validation happens; it never calls an
individual service's port directly.

---

## Frontend detail

### Screens

Auth (login/signup/forgot-password/guest), Home dashboard, Journal (templates + notebook +
tags/favorites), Gratitude Jar, Wellness Tree (XP/streak/skins), Habit tracker, Sleep tracker,
Breathing/grounding sessions, SOS (always free, never gated), Community, Counsellor directory +
booking + secure video sessions (Jitsi) + messaging, Peer Mentor requests + messaging, Wellness Hub
(articles/events), AI chat + insights, Notifications, and a full Admin Portal (user management,
counsellor/mentor approval, wellness content, community moderation, feature flags, admin
announcements, audit log).

### State management

Zustand, one store per domain (`useAuthStore`, `useSupportStore`, `useJournalStore`,
`useWellnessStore`, `useCommunityStore`, etc. — see `src/state/`). Every store follows the same
shape: a `load(token)` action that fetches from the real backend via `src/api/*.ts`, with
`loading`/data fields the relevant screen subscribes to.

### Navigation

React Navigation (native-stack + bottom-tabs). The full route list lives in
`src/navigation/types.ts`; every screen is registered in `src/navigation/RootNavigator.tsx`.

### Design tokens

`src/theme/tokens.ts` is the single source of truth for colors, spacing, radii, and type — never
hardcode a color or spacing value in a screen; add it to tokens.ts first.

### Ways to run this on your phone

**1. Expo Go, same Wi-Fi network (fastest)**
```bash
npm start
```
Scan the QR code with Expo Go. Phone and computer must be on the *same* Wi-Fi.

**2. Expo Go, tunnel mode (different networks)**
```bash
npx expo start --tunnel
```

**3. Standalone preview build via EAS (no Expo Go needed)**
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

**4. Local native build with USB**
```bash
npx expo run:android
npx expo run:ios
```

**5. Web preview (quick visual check only)**
```bash
npx expo start --web
```

### ⚠️ Expo Go SDK version

This project targets **Expo SDK 54**. Expo Go only supports one SDK at a time — if you get
`Uncaught Error: java.io.IOException: Failed to download remote update`, it's almost always an SDK
mismatch, not a network problem. Check your Expo Go app's SDK version (Profile tab) against
`"expo": "~54.0.0"` in `package.json`.

## Known gaps (tracked, not accidental)

- No Docker images / CI pipeline for the backend services yet (each service is run directly via
  Maven for local dev, as above).
- No crash-reporting/error-boundary layer in the frontend yet.
- Push notifications require a development build — they're not supported in Expo Go as of the SDK
  this project targets.

## Contributing

This is an active team project. Before pushing to `main`, push your work to a feature branch and
open a pull request so the team can review — see the repo's branch protection / PR workflow for
specifics.
