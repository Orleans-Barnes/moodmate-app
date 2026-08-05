# Prompt for Gemini: Build a New MoodMate Frontend (React Native / Expo)

Copy everything below into Gemini as your build prompt. It gives Gemini the product mission, the full backend contract, and the technical constraints needed to build a frontend that talks to the existing MoodMate backend without guessing at endpoints.

---

## 1. What MoodMate is and what it solves

MoodMate is a **student mental health and wellness platform** — a mobile app built for university/college students, with dedicated experiences for counsellors, trained peer mentors, and platform admins.

**The problem it solves:** student mental health support is fragmented and hard to access. Students often don't know where to turn when they're stressed, anxious, or in crisis; campus counselling services are overbooked or intimidating to approach cold; there's no easy way to track your own emotional patterns over time or notice when things are trending downward; peer support exists informally but isn't structured or safe; and severe distress (crisis-level language in a journal entry or AI chat) often goes unnoticed until it's an emergency. MoodMate exists to close these gaps in one connected app: **self-awareness tools** (mood check-ins, journaling, sleep tracking) feed into **actual human support** (book a real counsellor appointment, message a peer mentor, join a community of other students) and an **always-available AI companion**, with a **crisis-detection safety net** running underneath everything that can silently flag concerning language to a real counsellor or admin. Gamification (streaks, a growing tree, XP, leaves as a soft currency) is layered on to make the self-care habits themselves feel rewarding enough to stick with, and a Pro subscription plus a small wellness-library bookstore fund the platform.

**Four user roles, one backend:**
- **Student** — the primary user. Mood check-ins, journaling, sleep logging, wellness habits/goals, books a counsellor or peer mentor, community posts, AI chat, gamification, notifications.
- **Counsellor** — a vetted mental-health professional (self-serve signup, admin-approved). Manages their appointment queue, chats with students, sees their own analytics, sets availability status.
- **Peer Mentor** — a trained student volunteer (self-serve application, admin-approved). Handles connection requests from students, then messages them.
- **Admin** — platform operator. Approves counsellors/mentors, moderates community content, manages feature flags and institutions, views revenue and health-pulse analytics, broadcasts announcements, reviews crisis alerts.

**This new frontend's job:** build a completely new UI/UX design (visually distinct from the existing app is fine and encouraged — this is a design exploration, not a clone) that is *functionally* a drop-in replacement, wired to the exact same backend described in section 3. Same tech stack as the original app (section 2) so it can be dropped into the same monorepo/workflow.

---

## 2. Tech stack (must match)

- **React Native + Expo** (managed workflow), **TypeScript** throughout — no `.js` files.
- **React Navigation** (native-stack + bottom-tabs) for routing, with role-based root routing (see section 4).
- **Zustand** for state management (not Redux) — one store per domain (auth, wallet, journal, wellness, notifications, etc.), each with a `reset()` method for clean logout/guest-switch.
- Networking via a small typed `fetch`-based client (no axios needed) — see section 3 for the exact base URL convention and auth header pattern.
- `expo-secure-store` for persisting the JWT + refresh token.
- Guest mode must be supported: a synthetic `token === 'guest'` value that never gets sent to the real API and gates out backend-dependent screens gracefully.

---

## 3. Backend contract — read this carefully, do not invent endpoints

The backend is **13 Spring Boot microservices behind a single Spring Cloud Gateway**. Your app talks to **one base URL only** — the gateway — never to individual services directly.

```ts
export const BACKEND_BASE_URL = 'http://<dev-machine-LAN-IP>:8080';
```

The gateway verifies the JWT and forwards `X-User-Id`/`X-User-Role` downstream — you never construct those headers yourself, you just send `Authorization: Bearer <token>` and the gateway does the rest. A request with no/invalid token gets a bare `401` with no body. A rate-limited route (auth, wallet/payments, AI chat) that's hit too often returns a bare `429` with a `Retry-After` header.

**Global conventions:**
- Errors (once past the gateway) come back as: `{ timestamp, status, error, message, path }`.
- Timestamps are ISO-8601 UTC strings (`Instant`); some date-only fields are `"YYYY-MM-DD"`; a few time-of-day fields are `"HH:mm"` strings.
- Paginated endpoints take `?page=0&size=20` and return Spring's standard `Page<T>` shape (`content`, `totalElements`, `totalPages`, `number`, `size`, `first`, `last`, etc.).
- Enums are plain uppercase strings (`"CONFIRMED"`, `"STUDENT"`) **except** the AI chat service's `role`/`messageType` fields, which are lowercase (`"user"`, `"assistant"`, `"text"`).
- `Role` enum: `STUDENT, COUNSELLOR, MENTOR, ADMIN`.

**Auth flow:**
- `POST /api/auth/signup` → `{ email, password, fullName, institution?, institutionId? }` → `201 { token, refreshToken, user }`. Public signup always creates a `STUDENT` account — counsellor/mentor status is a separate application+approval flow (below), never set at signup.
- `POST /api/auth/login` → `{ email, password }` → `{ token, refreshToken, user }`.
- `POST /api/auth/guest` → creates/logs into a throwaway guest account.
- `POST /api/auth/refresh` → `{ refreshToken }` → new `{ token, refreshToken, user }`; rotates the refresh token (reuse of a revoked one kills every active session for that user — a real 401 there should force full logout, not a retry loop).
- `POST /api/auth/forgot-password` / `POST /api/auth/reset-password` — OTP-based, always returns 200 regardless of whether the email matched (don't leak account existence).
- The JWT's `role` claim only refreshes on next login/refresh — after an admin approves a counsellor/mentor application, that user must log out and back in (or hit `/refresh`) before their role-gated screens unlock. Build this expectation into your UX (e.g. a toast telling them to re-login after approval).
- **Counsellor/Mentor signup is two steps, not one**: (1) the user signs up as a normal student, (2) they submit `POST /api/support/counsellor-requests` or `POST /api/support/mentor-applications` with a bio/title, (3) an admin approves it, which is what actually flips their `Role`. Do not build a "sign up as counsellor" flow that expects immediate counsellor access.

**Full endpoint catalog, organized by service** (all paths below are relative to `BACKEND_BASE_URL`):

### `/api/auth/**`, `/api/users/**`, `/media/**`, `/api/push/**`, `/api/emergency-contacts/**` — moodmate-auth
- Public: `POST /api/auth/signup|login|guest|forgot-password|reset-password|admin-setup|refresh|logout`
- `GET/PUT /api/users/me`, `POST /api/users/me/avatar` (multipart, field `file`), `DELETE /api/users/me/avatar`
- `GET /api/users/meta/programmes|year-of-study|goals|challenges|support-types` — enum value lists for onboarding pickers
- `GET/PUT /api/users/me/notification-preferences` — per-type toggles + quiet hours (`"HH:mm"` strings)
- `GET /api/users/me/profile-status` — onboarding completion state
- `GET/PUT /api/users/me/student-profile` — programme, year of study
- `GET/PUT /api/users/me/wellness-preferences` + `POST .../complete`, `.../skip`, `.../prompted` — goals/challenges/preferred-support arrays, onboarding flow
- Admin: `GET /api/users/admin?query=&page=&size=`, `PATCH /api/users/admin/{id}/suspend|reinstate|role`
- `PUT/DELETE /api/push/token` — Expo push token registration
- `GET/POST/PUT/DELETE /api/emergency-contacts` + `POST /api/emergency-contacts/{id}/primary`

### `/api/checkins/**` — moodmate-mood
- `Emotion` enum: `HAPPY, CALM, HOPEFUL, GRATEFUL, MOTIVATED, ANXIOUS, STRESSED, LONELY, OVERWHELMED, FRUSTRATED`
- `POST /api/checkins` → `{ emotionKey, stressLevel(1-5), energyLevel(1-5), note? }`
- `GET /api/checkins?page=&size=`, `GET /api/checkins/trend?days=30`, `GET /api/checkins/count`
- `GET /api/checkins/student/{id}/trend` — counsellor/admin viewing a specific student
- `GET /api/checkins/analytics/trend/weekly|monthly`, `/stress-trend`, `/emotion-frequency`, `/mood-correlation|habit-correlation|sleep-correlation`

### `/api/sos/**` (public), `/api/support/**` — moodmate-support
- `GET /api/sos/resources?country=` — public crisis hotlines, no auth
- `GET /api/support/counsellors|mentors` — public-within-app rosters
- Counsellor self-serve: `POST /api/support/counsellor-requests`, admin: `GET .../pending`, `GET .../` (all), `POST .../{id}/approve|reject|suspend|reinstate`, `PATCH .../{id}` (edit)
- Mentor self-serve: `POST /api/support/mentor-applications`, admin: `GET .../pending`, `POST .../{id}/approve|reject`, `GET /api/support/mentors/admin`, `POST /api/support/mentors/{id}/activate|deactivate`
- Appointments: `POST/GET /api/support/appointments`, `POST .../{id}/cancel|reschedule`, `POST .../{id}/rating`, `GET .../{id}/meeting` (Jitsi join window)
- Counsellor side: `GET /api/support/counsellor/appointments`, `POST .../{id}/confirm|complete|cancel`, `GET .../{id}/meeting`, `POST /api/support/counsellor/availability-status`, `GET .../me/status`, `GET /api/support/counsellor/analytics`
- Conversations/messaging (student, counsellor, and mentor sides all mirror each other): `POST/GET /api/support/conversations`, `GET .../{id}/messages`, `POST .../{id}/messages`, `POST .../{id}/read`; same pattern under `/api/support/counsellor/conversations/**` and `/api/support/mentor/conversations/**`
- Mentor connection requests (distinct from applications above — this is a *student* requesting to connect with an *already-approved* mentor): `POST/GET /api/support/mentor-requests`, mentor side `GET /api/support/mentor/requests`, `POST .../{id}/accept|decline`

### `/api/community/**` — moodmate-community
- `ReactionType`: `HEART, PRAYER, MUSCLE, PARTY`. Posts have topics, threaded comments, reactions, reporting.
- `POST/GET /api/community/posts` (`?topic=&page=&size=`), `POST .../{id}/react`, `DELETE /api/community/posts/{id}`
- Comments: `POST /api/community/posts/{id}/comments`, `GET .../{id}/comments`, `PUT/DELETE /api/community/comments/{id}`
- Reporting/moderation: `POST .../{id}/report` (posts and comments), admin `GET /api/community/moderation/queue`, `POST .../reports/{id}/approve|remove|ban|warn`, `GET /api/community/flagged`, `POST/DELETE .../posts/{id}/flag`

### `/api/wellness/**`, `/api/hub/**`, `/api/habits/**`, `/api/sleep/**` — moodmate-wellness
- Core gamified state: `GET /api/wellness/state` (tree XP/stage, streak, today's goals, leaf balance), `POST /api/wellness/goals/{key}/toggle`, `POST /api/wellness/streak/shield`, `POST /api/wellness/boosts/double-xp`
- Habits: full CRUD + `POST .../{id}/toggle`, `GET .../{id}/history`, `GET .../{id}/stats`
- Wellness Hub: `GET /api/hub/articles` (Wellness Library reading content), `GET /api/hub/events` + RSVP, admin CRUD on both
- Sleep: `GET/POST/PUT/DELETE /api/sleep`, `GET .../analytics/weekly|monthly`, `GET/PUT .../goal`

### `/api/payments/webhook` (public), `/api/wallet/**`, `/api/payments/**` — moodmate-wallet
- Monetization: Pro subscriptions, leaf packs (in-app currency top-ups), and a small Books catalog — all go through the same Paystack-hosted-checkout pattern: `POST .../checkout` → `{ authorizationUrl, reference }` → open `authorizationUrl` in a browser/WebView → on return, `GET /api/payments/verify/{reference}` to confirm and fulfill.
- `GET /api/payments/plans|leaf-packs|books`, `POST .../subscription/trial|checkout`, `POST /api/payments/leaf-packs/checkout`, `POST /api/payments/books/checkout`
- `GET /api/payments/subscription`, `GET /api/payments/transactions`
- Wallet/cosmetics: `GET /api/wallet` (leaf balance + tree skins), `GET /api/wallet/transactions`, `POST /api/wallet/skins/{code}/equip`

### `/api/journal/**`, `/api/gratitude/**` — moodmate-journal
- `POST/GET/PUT/DELETE /api/journal`, `GET .../count`, `GET .../search?q=&dateFrom=&dateTo=&emotion=&favorite=&tag=`, `PUT .../{id}/favorite`, `PUT .../{id}/tags`, `GET .../tags`
- `POST/GET/DELETE /api/gratitude`

### `/api/gamification/**` — moodmate-gamification
- `GET /api/gamification/achievements`, `GET .../achievements/mine`, `POST .../achievements/unlock`
- `GET /api/gamification/missions`, `GET .../missions/progress`, `POST .../missions/progress`

### `/api/public/institutions/**` (public), `/api/admin/**` — moodmate-admin
- Public institution picker for signup: `GET /api/public/institutions`
- Everything else is ADMIN-only: `GET /api/admin/stats|health-pulse|revenue|audit-logs`, whitelist CRUD, analytics endpoints, `PATCH /api/admin/users/{id}/subscription` (manual override), feature flags CRUD (`GET /api/admin/feature-flags/public` is the one exception readable by any authenticated user — use it to gate features client-side), `POST /api/admin/announcements` (broadcast push), institution CRUD + license management

### `/api/crisis/**` — moodmate-crisis (COUNSELLOR/ADMIN only)
- `GET /api/crisis/alerts` (open only), `POST /api/crisis/alerts/{id}` (`ACKNOWLEDGE`/`RESOLVE`), `GET /api/crisis/admin/count`, `GET /api/crisis/admin/alerts` (ADMIN only, all statuses), `GET /api/crisis/alerts/{id}/emergency-contact`
- Crisis alerts are created automatically by the backend (AI chat + journal entries are scanned for crisis-indicating language server-side) — there is no student-facing "report a crisis" endpoint; the student experience for this is just the always-visible SOS resources screen (`/api/sos/resources`, public, no auth) and emergency contacts management.

### `/api/ai/**`, `/api/insights/**` — moodmate-ai
- `POST /api/ai/chat` — accepts text, base64 audio, or base64 image in one request shape; response includes a transcription field for voice notes.
- `GET /api/ai/chat/history`, `DELETE /api/ai/chat/history`
- `GET /api/ai/disclaimer`, `POST /api/ai/disclaimer/acknowledge` — must show and gate on this before first AI chat use
- `GET /api/ai/usage` — daily message quota (Pro users unlimited, free users capped) — surface remaining count in the UI
- `GET /api/insights` — AI-generated narrative summary of the student's recent wellness trends

### `/api/notifications/**` — moodmate-notifications
- `GET /api/notifications?page=&size=`, `GET .../unread-count`, `PATCH .../{id}/read`, `PATCH .../read-all`
- Notification types cover reminders, appointment status changes, mentor requests, counsellor/mentor approval status changes, crisis alerts, community/admin broadcasts, achievements — build a generic notification-center list that switches icon/deep-link by `type` and `destinationScreen`, rather than hardcoding a screen per type.

---

## 4. Role-based app structure

Route the user into a completely different tab navigator based on `user.role` from the JWT/login response — do this once at the root, not per-screen:
- `STUDENT` → full app: Home, Mood check-in, Journal, Wellness Hub (habits/sleep/articles/events), Community, Support (browse counsellors/mentors, book appointments, conversations), AI Chat, Wallet/Shop, Profile/Settings, Notifications.
- `COUNSELLOR` → counsellor dashboard: appointment queue, availability toggle, conversations, own analytics.
- `MENTOR` → mentor dashboard: incoming connection requests, conversations.
- `ADMIN` → admin console: stats/health-pulse, counsellor/mentor approval queues, community moderation, crisis alerts, feature flags, institutions, announcements, revenue.

A `STUDENT` who has submitted a pending counsellor/mentor application should still see the normal student app (they aren't a counsellor yet) — don't build a separate "pending" role state, just reflect their application status somewhere reachable (e.g. profile/settings) since the backend has no dedicated "my application status" endpoint beyond what they submitted.

---

## 5. Design direction

You have creative freedom on visual design, navigation shape, and screen layout — this is explicitly meant to be a *different* look from the existing MoodMate app, not a pixel clone. What must carry over is the **product logic**: every screen listed above needs a home somewhere in your navigation, every API call needs to use the exact request/response shapes in section 3, and the tone should stay warm, calm, and non-clinical — this is a mental-health product for stressed students, not an enterprise dashboard. Avoid anything that could feel alarming or judgmental in copy (especially around mood check-ins, journaling, and crisis-adjacent screens like SOS resources).
