# MoodMate — Master Implementation Blueprint

**Prepared:** July 21, 2026
**Method:** Every claim below was verified by reading the actual source of both repositories —
backend at `MoodMate Backend` (13 Spring Boot microservices + gateway, not 14 — confirmed by
directory count), frontend at `moodmate-app-frontend\moodmate-app` (React Native/Expo/TypeScript).
Backend state: commit `092091b`. Frontend state: commit `0fa2615` plus one pending commit (the
Wellness Hub navigation fix from this session's audit). Where the existing
`MASTER_IMPLEMENTATION_TRACKER.md` (dated 2026-07-19) conflicts with the code, the code wins — that
tracker predates Institution Management, the 5-feature premium gating pass, and the Admin Revenue
Dashboard, all of which have since shipped.

This document corrects two specific claims from the synthesis you shared before I ran this
verification pass: **Institution Management is not "currently non-existent"** — it shipped this
session, with full CRUD, a public catalogue endpoint, and admin UI. What's actually missing is the
*licensing/subscription layer on top of it*, which is a real and large gap, just not the same gap
as "the feature doesn't exist." Second, **the AI platform's dual-model routing is not
"uncommitted work in progress"** — Groq and Gemini are both live today with automatic failover;
that was true as of an old tracker snapshot but has since shipped.

---

## 1. Executive Summary

MoodMate is further along than a typical hackathon-stage product, but not for the reasons the
initial synthesis suggested. The individual student-facing wellness features (mood, journal,
habits, sleep, AI chat, gamification, dashboard) are genuinely complete and were not touched in
this verification pass because they were solid in every prior audit. The real story is uneven
depth in three specific places:

- **Admin Platform** is far more built than "weakest part" suggests — 8 of the tracker's original
  9 modules exist and work end-to-end. Its actual gaps are narrow and specific (see §3).
- **Monetization** has a genuinely solid payment core (real Paystack subscriptions, a working
  wallet, 5 gated premium features) but zero of the *business-model breadth* items (coupons,
  institution licensing, consultation fees, courses) exist even as stubs.
- **Community** has a backend that is more capable than its frontend exposes — nested threaded
  comments are fully built server-side but have **no UI at all**, and a self-delete button on the
  frontend is silently broken (calls an admin-only endpoint that will 403 any real user). This is
  the single most surprising finding of this audit.

Production readiness is the weakest layer by a wide margin and matches the original synthesis's
instinct: no Docker for the 13 app services, no CI/CD at all, no frontend test framework, sparse
accessibility coverage. The monitoring stack is a pleasant exception — Prometheus + Grafana are
genuinely wired and scraping real `/actuator/prometheus` endpoints, not a stub.

---

## 2. Current Completion — Verified

| Dimension | Verified estimate | Basis |
|---|---|---|
| Student-facing feature completeness | **~95%** | Every core loop (mood→journal→AI→community→booking→premium) works end-to-end on real data; gaps are narrow (community comment UI, shop order history). |
| Admin platform completeness | **~80%** | 8/9 tracker modules shipped and working; gaps are role-change, content edit UI, feature-flag consumption, audit coverage breadth — all narrow, not structural. |
| Monetization *core* (subscriptions, wallet, gating) | **~85%** | Real payment processing, real gating, real expiry job. No grace period, no admin override. |
| Monetization *breadth* (licensing, coupons, courses, consultation fees) | **~5%** | None of these exist beyond unused placeholder DB columns on `Institution`. |
| Community | **~55%** | Backend ~90% (missing only pin/restore); frontend ~20% (no comment UI, no report UI, broken delete). |
| Counsellor/Peer Mentor platforms | **~90%** | Both are functionally complete; gaps are narrow (double-booking, auto-complete-on-call-end, status restore, analytics windowing). |
| Testing infrastructure | **~25%** | Backend has 41 real test files but uneven coverage (some services have exactly 1). Frontend has zero test framework — one file uses Node's bare test runner, not Jest. No E2E anywhere. |
| Production readiness | **~30%** | Monitoring stack real and working. Everything else (Docker, CI/CD, backups, staging, crash reporting, security hardening) is absent. |

**Overall functional completion for a v1 launch: ~78–82%.** This is lower than the "90–93%"
figure in the initial synthesis specifically because of the community frontend gap and the
monetization-breadth gap, both of which are larger than that synthesis accounted for — but higher
in the admin/institution dimension, which that synthesis undercounted.

---

## 3. Milestone-by-Milestone Blueprint

### Milestone 1 — Admin Platform

**Current state (verified):**
- Admin auth: `AdminController.requireAdmin()` role-gates every handler; `LoginScreen.tsx` has a
  full ADMIN theme/flow; `RoleSelectScreen.tsx`'s hidden 7-tap gesture correctly routes there (this
  session's audit found and fixed a dead-end here). **Done.**
- User Management: search/suspend/reinstate exist both layers. **Role-change endpoint does not
  exist anywhere** (not backend, not frontend).
- Counsellor Management: approve/reject/suspend/reinstate/edit all exist backend-side
  (`AdminEditCounsellorRequest`), but the edit form has **no frontend UI** — `adminEditCounsellor`
  is defined in `api/support.ts` but never called.
- Peer Mentor Management: activate/deactivate wired both layers. No ratings model exists
  (deliberately out of scope, no `PeerMentorRating` entity).
- Community Moderation: fully wired both layers, audit-logged.
- Wellness Content: create/delete wired both layers; **edit exists backend-only**, no frontend
  form (documented as a deliberate scope cut, not forgotten).
- Audit Logs: real `AuditLog` entity + service, consumed by auth/support/community actions. **Not
  consumed by**: wellness content CRUD, feature-flag CRUD, institution CRUD, announcement sends.
- Feature Flags: full CRUD exists and works as admin-manageable state — **but nothing in either
  codebase reads a flag's value to actually change behavior.** This is pure dead weight today: an
  admin can flip a switch that does nothing.
- Announcements: fully wired, synchronous fan-out via notifications service.
- Analytics/Revenue: `/analytics/checkins`, `/analytics/moods`, `/analytics/institutions` (grouped
  by free-text string, not FK), `/revenue` (live, uncached). **No retention, no engagement/DAU
  trend, no appointment-specific analytics** beyond raw counts.

**Missing pieces:**
- *Backend:* role-change endpoint; audit logging for wellness/flags/institutions/announcements;
  something that actually reads feature flags at runtime.
- *Frontend:* counsellor specialties/availability edit form; wellness content edit form;
  role-change UI.
- *Business logic:* decide what feature flags should actually gate before building more of them —
  right now they're a UI for a system with no consumer.

**Dependencies:** None blocking — this milestone can proceed independently of everything else.

**Risks:** Low technical risk (all additive to existing, working patterns). The feature-flag gap is
a *product* risk more than technical: if you present "feature flags" as a capability, be ready for
the question "flags for what?" — today the honest answer is none.

**Deliverables:** role-change endpoint + UI; two missing edit forms; audit coverage for the four
uncovered action types; either wire flags to something real (e.g. gate the courses/bootcamps
milestone behind one) or de-scope the feature-flags UI from the demo narrative.

**Verification checklist:** admin suspends/reinstates a user and changes their role; admin edits a
counsellor's specialties and confirms it reflects on `SupportScreen`; admin edits then deletes a
wellness article; every one of the four newly-audited action types produces an audit log row;
toggle a feature flag and confirm *something* observable changes.

---

### Milestone 2 — Institution Management

**Current state (verified) — this milestone is further along than "doesn't exist":**
- `Institution` entity: id, name, shortName, city, country, type, active, website, logoUrl,
  **licenseType, licenseExpiry, studentLimit** (last three explicitly documented in the entity's
  own comment as "nullable and unused by any endpoint yet — nothing reads or writes them today").
- Full admin CRUD (`AdminInstitutionManagementScreen.tsx`): create, inline-edit, activate/deactivate
  (soft, no hard delete).
- Public unauthenticated catalogue endpoint backs the signup institution picker, with a
  live→cached→bundled fallback chain on the frontend.
- `institutionBreakdown()` analytics groups users by the free-text `institution` string on
  `auth.users` — **not a foreign key.** There is no `institutionId` column anywhere in either
  repo (confirmed by exhaustive grep).

**What's genuinely missing — this is the real gap, and it's substantial:**
- No FK relationship between a user and an `Institution` row — signup only stores a free-text
  string that happens to usually match a real institution's name.
- No connection whatsoever between `Institution` and `UserSubscription`/`PaymentTransaction`/Pro
  status — the three "licensing" columns on `Institution` are inert placeholders.
- No institution-level dashboard, no seat/plan model, no renewal flow, no institution-scoped
  analytics beyond the one breakdown-by-string-label chart.

**Dependency chain (this is the correct order, and matches your own instinct):**
```
Institution ↔ User FK (replace free-text field)
    ↓
Institution licensing fields actually read/written (plan, seats, expiry)
    ↓
Institution-level subscription/payment record (new entity, likely in moodmate-wallet
    or a new small module — reuses PaymentTransaction's purpose/status pattern)
    ↓
"Does this user's institution have an active license" check, wired into the SAME
    isPro-style gate WalletService/PaymentsService already use for individual Pro status
    ↓
Institution dashboard (usage, seat consumption, renewal date)
    ↓
Institution-scoped analytics (real FK-based, not string GROUP BY)
```

**Risks:** Migration risk is real but manageable — moving from a free-text `institution` field to
a FK requires a backfill migration matching existing strings to `Institution.name`/`shortName`,
with a fallback bucket for unmatched values. This should happen before, not after, building
licensing on top, or the licensing logic inherits the same string-matching fragility.

**Deliverables:** `institutionId` FK on `User` (with backfill migration); a real
`InstitutionSubscription` or similar entity; an "institution license active" check consumable
anywhere `isPro` is checked today (same `PaymentsServiceClient` pattern — this is the "don't
duplicate" answer: extend the existing cross-service Pro-check pattern rather than building a
second parallel one); institution dashboard screen (admin-facing, scoped to one institution).

**Verification checklist:** create an institution, assign real users to it via signup, confirm the
FK persists (not just string match); grant that institution a license; confirm a bypass of
individual Pro-gating for its assigned students; confirm institution-scoped analytics reflect real
assigned users, not string-matched guesses.

---

### Milestone 3 — Premium & Monetization

**Current state (verified):**
- Real Paystack subscriptions: Monthly (₵15/mo) and Yearly (₵120/yr) plans, both with a 7-day free
  trial, one trial per user ever.
- `SubscriptionExpiryJob` runs daily, flips TRIALING/ACTIVE → EXPIRED on schedule. **No grace
  period or past-due state** — expiry is a hard cliff.
- 5 features actually gated with soft-lock UI (this session's work): exclusive tree skins, full
  music library, Bubble Pop game, unlimited AI insights (server-enforced quota), priority
  counsellor booking.
- `ProScreen.tsx`: real plan cards with live pricing, Paystack hosted checkout via system browser,
  post-checkout verification on refocus, plus a trial-start path that bypasses payment entirely.
- Admin revenue dashboard: live (uncached) totals split by subscription vs. leaf-pack revenue,
  active/trialing counts.

**Confirmed absent — not partially built, not stubbed, genuinely absent:**
- Coupon/discount/promo codes: zero traces anywhere in either repo.
- Admin ability to grant/revoke Pro status or override pricing for a specific user: does not exist.
- Counsellor consultation fees: booking is currently entirely free; no fee concept exists.
- Courses, bootcamps, digital resources, books: zero traces beyond a stale planning doc and one
  unrelated string match in example CBT content. Not partially built — not started.
- Shop purchase/order history: the backend endpoint (`listMyTransactions`) exists but nothing in
  the frontend calls it — no screen shows it.

**What's built and solid, contrary to "needs verification":**
- Every one of the 5 gated features was individually confirmed server-side-enforced (not just
  client-side hidden) — `WalletService.equipSkin` re-checks Pro status live on every equip, not
  just at purchase; AI quota is enforced server-side via `PaymentsServiceClient`, never trusted
  from the client.

**Recommended sequencing:**
```
Grace period + admin override (small, unblocks support workflows immediately)
    ↓
Coupon/promo code model (needed before any institution-licensing "free seat" flow
    can reasonably be demoed — a license is functionally a permanent 100%-off coupon)
    ↓
Institution licensing (Milestone 2's gap) — reuses the coupon/override machinery above
    ↓
Consultation fees (only if the business model actually requires paid 1:1 sessions —
    confirm this is a real requirement before building, since free booking may be intentional)
    ↓
Courses/bootcamps/books — genuinely new subsystems, treat as their own milestone,
    not a sub-task, given zero existing scaffolding
```

**Risks:** The "hard cliff" expiry (no grace period) is a real UX risk for a paying customer whose
card fails transiently — worth fixing early regardless of what else ships. Building courses/
bootcamps without validating demand first is the highest-effort, most speculative item in this
entire blueprint — recommend treating it as genuinely optional for a v1 launch rather than a
committed milestone.

**Deliverables:** grace-period state on `UserSubscription`; admin override endpoint + UI; a
`PromoCode`/`Coupon` entity reusable by both direct discounts and institution "free seat" grants;
shop purchase-history screen (the backend already supports it — pure frontend wiring, cheapest
item in this milestone).

**Verification checklist:** let a subscription lapse and confirm grace-period behavior before hard
expiry; admin grants Pro to a specific user and confirms it reflects immediately; apply a promo
code at checkout and confirm the discount; view purchase history and confirm it matches actual
leaf/subscription transactions.

---

### Milestone 4 — Counsellor Platform

**Current state (verified):** booking/reschedule/confirm/complete/cancel all implemented; Jitsi
video sessions wired to real "Join Session" buttons on both student and counsellor sides;
availability status persists server-side; analytics endpoint returns real lifetime counts.

**Missing pieces:**
- No double-booking prevention — `bookAppointment` doesn't check for overlapping confirmed slots
  for the same counsellor.
- Video call end doesn't auto-complete the appointment — `VideoSessionScreen.tsx` just navigates
  back on `readyToClose`; counsellor still manually clicks "Mark Complete."
- No "get my own status" endpoint — the dashboard workaround re-fetches the entire counsellor list
  and filters to itself, which is fragile and wasteful, not just inelegant.
- Analytics are lifetime-only, no time windowing (no "this month" view).
- No institution-sponsored or premium-only session concept exists at all — only booking *priority*
  for Pro users exists, which is a queue position, not gated access.

**Dependencies:** None on other milestones except the "premium sessions" item, which depends on
Milestone 3's consultation-fee decision.

**Risks:** Double-booking is the one item here with real user-trust risk if left unfixed before
any real-world pilot — recommend prioritizing it above the others in this milestone.

**Deliverables:** overlap check in `bookAppointment`; call-end → `completeAppointment` wiring; a
real `GET /counsellor/me/status` endpoint; time-windowed analytics option.

**Verification checklist:** attempt to book two overlapping slots for the same counsellor and
confirm rejection; end a video call and confirm the appointment auto-completes; reload the
counsellor dashboard after a status change and confirm it restores correctly without the
list-filtering workaround.

---

### Milestone 5 — Peer Mentor Platform

**Current state (verified):** this is close to done. Discovery, full request/accept/decline state
machine, mentor-side messaging (same Supabase-optional/polling-fallback pattern as counsellor
chat), self-serve signup *and* admin-linked account creation both coexist. The trimmed mentor
dashboard (no analytics/session-history/appointments) is a **documented deliberate choice**, not a
gap — mentors don't book sessions, so those concepts genuinely don't apply.

**Missing/uncertain:**
- Mentor-request notification producers (`SupportService.notifyMentor`) send free-text
  title/body but never pass a `NotificationType` enum value — the constants
  (`MENTOR_REQUEST`/`MENTOR_ACCEPTED`/`MENTOR_DECLINED`) exist but their actual use on the
  receiving/auth side wasn't confirmed in this pass and needs a follow-up check.
- No re-request cooldown after a decline (may be intentional — a student can immediately
  re-request the same mentor after being declined).

**Dependencies:** None.

**Risks:** Low — this is the most complete non-core-loop feature in the app.

**Deliverables:** confirm/fix the notification-type wiring gap; decide whether decline-then-
immediately-re-request is desired behavior or needs a cooldown.

**Verification checklist:** the device walkthrough already called for in the old tracker and never
completed — request a mentor, accept, message both directions, confirm a push/in-app notification
fires with the correct type tag, decline a request and attempt to re-request immediately.

---

### Milestone 6 — Community

**This is the single most important finding of this entire audit.** The backend is materially
more capable than the frontend exposes, and one frontend control is silently broken.

**Current state (verified):**
- Anonymous posting with a free-form topic field (no structured mood tag/category).
- **Nested, arbitrarily-deep threaded comments are fully built server-side** (`PostComment` with
  self-referential `parentCommentId`, cascading delete) — genuinely production-quality comment
  infrastructure that the frontend never calls.
- Moderation (report/review/approve/remove/ban/warn) fully built and wired to a working admin
  screen — confirmed in this session's earlier audit.

**Confirmed broken, not just missing:**
- **Self-delete is dead end-to-end.** `CommunityController.delete` requires ADMIN role only —
  there is no author-self-delete endpoint. The frontend renders a delete button gated on
  `post.isOwn`, but the backend's `PostResponse` DTO never actually returns an ownership field, so
  `isOwn` is always `undefined` and the button never renders in practice. Even if it somehow
  rendered, tapping it would 403. This needs either a real self-delete endpoint or the dead button
  removed — currently it's neither working nor absent, which is worse than either.
- **No comment/reply UI exists on `CommunityScreen.tsx` at all**, despite full backend support —
  no comment count, no thread view, no way to add a comment. This is pure frontend work sitting on
  top of an already-complete backend.
- **No report-a-post UI for regular users** — the API functions exist (`api/community.ts`) but no
  screen calls them; only the admin queue is reachable.

**Confirmed genuinely absent:** pinned posts (no entity field, no endpoint, nothing); post
restoration after removal (both moderation and direct removal hard-delete, no soft-delete/restore
path exists).

**Dependencies:** None — every item here is pure frontend work against an already-complete (or
near-complete) backend, making this one of the highest-ROI milestones in the entire blueprint.

**Risks:** Low technical risk. The main risk is reputational/UX if this ships to real users with
the currently-broken delete button visible — recommend this as a near-immediate fix regardless of
when the rest of the milestone lands.

**Deliverables:** comment/reply UI (thread view, add comment, reply-to-comment); working self-
delete (either a real author-scoped endpoint, or remove the dead button if self-delete isn't
actually desired product behavior); report-a-post UI for regular users; decide if pin/restore are
in scope for v1 or deferred.

**Verification checklist:** post as a user, add a nested reply-to-a-reply, confirm it renders
correctly threaded; attempt to delete your own post and confirm it actually works (or confirm the
button is removed if self-delete is descoped); report a post as a regular user and confirm it
appears in the admin moderation queue.

---

### Milestone 7 — Wellness Marketplace (Tree Shop)

**Current state (verified):** 6 tree skins (2 Pro-exclusive, re-checked live on every equip, not
just purchase), 3 leaf packs, streak-freeze/double-XP boosts fully wired end-to-end including the
actual gameplay effect (`GoalEngine` applies the XP multiplier).

**Missing pieces:** no dedicated inventory/preview screen (only the shop grid and the currently-
equipped skin on the tree itself — no "my collection" view); no purchase/order history screen
(backend endpoint exists, unused); no search/categories (only 6 skins and 3 packs exist, so this
may be premature until catalogue size grows).

**Dependencies:** Purchase history wiring is trivial and independent. Inventory/preview is
independent. Categories/search should wait until the catalogue is actually large enough to need
them — building search for 6 items is speculative effort.

**Deliverables:** purchase history screen (cheapest item in this whole blueprint — pure frontend
call to an existing endpoint); optional "my collection" inventory view.

**Verification checklist:** purchase a skin, equip it, view purchase history and confirm the
transaction appears correctly labeled.

---

### Milestone 8 — AI Platform

**Current state (verified) — more complete than the old tracker suggested:**
- Both Groq and Gemini are live with automatic failover (`AiModelRouter`) — this was "uncommitted
  work in progress" in the old tracker; it has since shipped and is not a gap.
- Crisis keyword detection runs before every AI chat message and escalates to `moodmate-crisis`;
  the system prompt also instructs the model to redirect distress to real resources.
- Server-side AI quota enforcement (5/day free, unlimited Pro), verified via the real
  cross-service Pro check, never trusted from the client.
- `/api/insights` generates real mood-trend narratives via the same router, with a templated
  fallback if both providers fail.

**Confirmed deliberately absent:** journal AI summarization — insights are generated from
mood-trend data only; journal content is explicitly excluded per the insights service's own doc
comment. This may be intentional (journal privacy) rather than a gap — worth confirming as a
product decision rather than assuming it should be built.

**Deliverables:** none required unless journal summarization is confirmed as a real product
requirement — if so, treat it as new scope with the same privacy consideration the current
exclusion implies.

**Verification checklist:** trigger a crisis-keyword message and confirm escalation fires; exhaust
the free daily AI quota and confirm the 6th request is blocked with the correct upgrade prompt;
force a Groq failure (or review the router logic) and confirm Gemini failover actually engages.

---

### Milestone 9 — Notifications

**Current state (verified):** this is essentially done. Preferences (5 toggles + quiet hours),
push (Expo, gated by `PushGatingRule` respecting toggles/quiet-hours/crisis-bypass), in-app
notification center (real data, mark-read, unread badge) — all confirmed genuinely wired to real
backend data, not mocked.

**Confirmed gap:** push notification payload only carries the destination screen name, not full
params — tapping a push can land you on the right screen but not, say, the specific post or
appointment it was about. In-app taps from the notification center *do* carry full params, so this
is specifically an OS-push limitation, not a systemic one.

**Deliverables:** extend push payload to carry `destinationParams` (both backend `NotificationService`
and frontend `App.tsx`'s tap handler need matching changes — small, well-scoped).

**Verification checklist:** trigger a push for an event with meaningful params (e.g. a specific
appointment), tap it, confirm it lands on that specific record, not just the general screen.

---

### Milestone 10 — Testing

**Current state (verified):**
- Backend: 41 real test files across 13 services — genuine unit and controller-slice tests, not
  smoke tests. Coverage is uneven: `auth` (10) and `wellness` (7) are well covered; `admin`,
  `gamification`, `support`, `wallet` have exactly 1 test file each despite being large, business-
  logic-heavy services.
- Frontend: **zero test framework configured.** No Jest, no React Native Testing Library, in
  `package.json`. One file uses Node's bare `node:test` runner against pure logic
  (`recommendationEngine.ts`) — no component or screen tests exist at all.
- No E2E/integration test tooling anywhere (no Detox, Playwright, Cypress, Postman/Newman).

**This is a genuinely large gap**, not just "needs verification" as the original synthesis framed
it — there is close to zero automated safety net on the frontend, and thin coverage on several
backend services that handle real money (`wallet`) and admin actions (`admin`).

**Recommended approach, in order:**
1. Backend: bring `wallet`, `support`, `admin` up from 1 test file to real coverage of their core
   business logic (payment fulfillment, booking state machine, admin actions) — highest risk-to-
   reward given these handle money and privileged actions.
2. Frontend: install Jest + React Native Testing Library; start with the highest-value, lowest-
   effort tests — pure logic (stores, utils) before component rendering tests.
3. Manual device-walkthrough checklist (the old tracker already has good per-phase checklists —
   consolidate them into one master pass covering every role: student, guest, counsellor, mentor,
   admin) — this is the fastest way to close real gaps before investing in full E2E automation.
4. E2E automation (Detox for RN) — only after the manual checklist above surfaces that manual
   testing itself is becoming the bottleneck, not before.

**Deliverables:** a consolidated manual test matrix (one document, every role × every major flow);
Jest configured on the frontend with a first real test suite; wallet/support/admin backend test
coverage brought to parity with auth/wellness.

---

### Milestone 11 — Production Readiness

**Current state (verified):**
- Monitoring is real: Prometheus + Grafana via `docker-compose.monitoring.yml`, scraping actual
  `/actuator/prometheus` endpoints on every service via `host.docker.internal` (since the 13 app
  services themselves are not containerized — they run via `mvnw spring-boot:run`/`start-all.bat`).
- Secrets management is genuinely clean: every service consistently uses `${VAR:default}` env-var
  patterns; no hardcoded real secrets found anywhere in either repo (only clearly-labeled dev
  placeholders like `dev-only-secret-change-me-before-deploy`).
- `app.json` is properly customized (real bundle IDs, splash colors, permission descriptions) —
  not left at Expo scaffolding defaults. Version is still pre-1.0 (`0.1.0`), which is appropriate
  for current stage. No top-level iOS `icon` field is set — worth fixing before an App Store
  submission specifically.
- Accessibility coverage is sparse — roughly 11% of screens use `accessibilityLabel`/
  `accessibilityRole` at all, concentrated in a handful of screens.
- `src/config.ts`'s `BACKEND_BASE_URL` is confirmed still a hardcoded LAN IP with a manual-edit
  instruction in the comment — a genuine, real dev-only gap that would break immediately in any
  non-local environment.

**Confirmed absent:** Dockerfiles for any of the 13 app services; any CI/CD pipeline
(`.github/workflows`, or equivalent) in either repo; crash reporting (no Sentry/Bugsnag/equivalent
found); backup/restore procedures for the shared Postgres instance; staging environment.

**Deliverables, roughly in dependency order:**
```
Dockerize each of the 13 services (individually, incrementally — reuse the existing
    application.yml env-var discipline, don't redesign config)
    ↓
docker-compose.yml for full local orchestration (extends, doesn't replace,
    the existing docker-compose.monitoring.yml)
    ↓
CI pipeline: build + test on push (leverage the 41 existing backend tests +
    whatever Jest suite Milestone 10 produces)
    ↓
Environment-based config (replace config.ts's hardcoded IP with a real
    build-time/env mechanism — expo-constants or app.config.js)
    ↓
Staging environment (deploy the containerized stack somewhere real)
    ↓
CD pipeline (staging → production promotion)
    ↓
Crash reporting + accessibility pass + security review + App Store assets
    ↓
Backup/restore validation for Postgres
```

**Risks:** This milestone has the highest pure-effort cost in the blueprint and the least code
reuse from existing work — it's genuinely new infrastructure, not extension of existing patterns.
Recommend starting Docker work early and in parallel with other milestones (it doesn't block or
get blocked by feature work) rather than treating it as strictly last.

**Verification checklist:** a fresh clone of both repos, following only the README, running
`docker-compose up` and reaching a fully working app with zero manual `.env` editing beyond
providing real API keys; a CI run that fails on a deliberately broken test; a staging deploy
reachable from a real device off the local network.

---

## 4. Master Dependency Graph

```
                        ┌─────────────────────────┐
                        │   Admin Platform (M1)    │  ← independent, do anytime
                        └────────────┬─────────────┘
                                     │ (institution CRUD already exists here)
                                     ▼
                        ┌─────────────────────────┐
                        │ Institution Mgmt (M2)     │
                        │  FK migration → licensing │
                        └────────────┬─────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
              ┌─────────┤ Premium & Monetization    │
              │         │  (M3) grace/override/     │
              │         │  coupons/institution link │
              │         └────────────┬─────────────┘
              │                      │
              ▼                      ▼
   ┌────────────────────┐  ┌─────────────────────┐
   │ Counsellor (M4)      │  │ Marketplace (M7)      │  ← both independent of
   │ consultation fees    │  │ purchase history      │    each other, loosely
   │ depend on M3 decision│  │                        │    depend on M3
   └──────────┬──────────┘  └──────────────────────┘
              │
              ▼
   (Peer Mentor M5, Community M6, AI M8, Notifications M9 are ALL independent
    of M1–M4 and of each other — no blocking dependencies found. Sequence by
    ROI, not by technical necessity: Community M6 is the highest-ROI item in
    this entire blueprint, pure frontend work on an already-built backend.)

                        ┌─────────────────────────┐
                        │  Testing (M10)            │  ← should run continuously
                        │  alongside every milestone│    alongside all of the above,
                        └────────────┬─────────────┘    not strictly after
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │ Production Readiness (M11)│  ← Docker work can start
                        │                            │    early/parallel; CI/CD
                        │                            │    genuinely depends on M10
                        └────────────────────────────┘
```

**Key correction to the "everything is sequential" framing:** most of these milestones do not
actually block each other. The only real hard dependency chain is Institution → Licensing →
Institution-aware Premium checks. Community, Peer Mentor, AI, and Notifications can all proceed
in any order or in parallel, and Docker/CI groundwork can start immediately rather than waiting
for every feature milestone to close first.

---

## 5. Recommended Implementation Order (by ROI, not just dependency)

1. **Community frontend (M6)** — highest ROI in the blueprint. The backend is essentially done;
   this is almost pure UI work, and it fixes a currently-broken, user-visible button.
2. **Admin Platform narrow gaps (M1)** — small, well-scoped, independent items (role-change,
   two edit forms, audit coverage, feature-flag decision).
3. **Monetization core hardening (M3, first half)** — grace period + admin override. Small,
   protects real users/revenue immediately.
4. **Counsellor/Peer Mentor narrow gaps (M4, M5)** — small, independent, closes real but minor
   trust/UX risks (double-booking, call-end auto-complete, notification-type wiring).
5. **Institution licensing (M2 full build-out)** — the biggest single feature gap, and a real
   prerequisite for any institution-based business model.
6. **Testing investment (M10)** — should already be running in parallel by this point, but treat
   backend wallet/support/admin coverage and a frontend Jest baseline as a hard checkpoint before
   any production push.
7. **Docker + CI/CD groundwork (M11, first half)** — start in parallel with the above, don't wait.
8. **Remaining monetization breadth (M3, second half: coupons, consultation fees)** — only after
   confirming these are real product requirements, not assumed ones.
9. **Courses/Bootcamps/Books** — treat as optional/future scope for v1, given zero existing
   scaffolding and unconfirmed demand; revisit post-launch.
10. **Full production readiness close-out (M11, remainder)** — staging, crash reporting,
    accessibility pass, security review, App Store assets.

---

## 6. Timeline (effort-based, assuming the current single-developer-plus-AI-pairing pace this
project has demonstrated, not a hackathon sprint)

| Milestone | Estimated effort | Notes |
|---|---:|---|
| Community frontend (M6) | 3–5 days | Backend done; pure frontend build against existing API. |
| Admin narrow gaps (M1) | 3–5 days | Small, independent items. |
| Monetization core hardening (M3 first half) | 2–4 days | Grace period + admin override only. |
| Counsellor/Mentor narrow gaps (M4/M5) | 3–5 days | Independent, well-scoped fixes. |
| Institution licensing (M2) | 1.5–2.5 weeks | Real new subsystem; migration risk requires care. |
| Testing investment (M10) | Ongoing + 1 week checkpoint | Should run continuously, not as a single block. |
| Docker + CI groundwork (M11 first half) | 1–1.5 weeks | Can start in parallel with anything above. |
| Remaining monetization breadth (M3 second half) | 1–2 weeks | Coupons + consultation fees, if confirmed needed. |
| Courses/Bootcamps/Books | 2–4 weeks | Optional; treat as post-v1 unless demand is confirmed. |
| Full production close-out (M11 remainder) | 2–3 weeks | Staging, crash reporting, accessibility, security, store assets. |

**Realistic v1-launch-ready timeline (excluding optional Courses/Bootcamps):
roughly 6–9 weeks** at this project's demonstrated pace, assuming testing and Docker groundwork
run in parallel with feature work rather than strictly after it.

---

## 7. Risk Assessment Summary

| Risk | Severity | Where |
|---|---|---|
| Community self-delete silently broken, currently shippable as-is | Medium (user trust) | M6 |
| No frontend test framework at all | Medium (regression risk grows with every future change) | M10 |
| No grace period on subscription expiry | Medium (real customer payment friction) | M3 |
| Institution free-text field → FK migration | Medium (data migration risk if done carelessly) | M2 |
| No double-booking prevention for counsellors | Medium (real-world trust risk) | M4 |
| No Docker/CI at all | High (blocks any real deployment, but well-understood, standard work) | M11 |
| Feature flags exist with zero runtime consumers | Low (wasted effort risk, not a bug) | M1 |
| Sparse accessibility coverage | Medium (compliance/inclusivity risk for a mental-health app specifically) | M11 |
| Courses/Bootcamps built without confirmed demand | Medium (highest-effort, most speculative item in the whole blueprint) | M3 |

---

## 8. Definition of Done — Per Milestone (summary; full checklists are in each milestone section
above)

- **M1 Admin:** every listed action has both a working endpoint and a working UI, and produces an
  audit log entry where applicable.
- **M2 Institution:** a real user is FK-linked to a real institution; that institution can hold a
  license; that license visibly bypasses individual payment for its assigned students.
- **M3 Monetization:** a lapsed subscription enters a grace period before hard expiry; an admin can
  override a specific user's Pro status; a promo code visibly changes a checkout price.
- **M4 Counsellor:** two overlapping bookings for the same counsellor are rejected; a completed
  video call auto-transitions the appointment without a manual click.
- **M5 Peer Mentor:** a full request→accept→message device walkthrough succeeds with correctly
  typed notifications firing at each step.
- **M6 Community:** a user can post, thread a reply three levels deep, delete their own post
  successfully, and report someone else's post — all without touching the admin panel.
- **M7 Marketplace:** a purchase appears in a real, viewable history.
- **M8 AI:** a crisis-keyword message visibly escalates; quota exhaustion visibly blocks and
  prompts upgrade; failover between providers is confirmed, not just theorized.
- **M9 Notifications:** a push notification with meaningful params lands the user on the specific
  record it refers to, not just the general screen.
- **M10 Testing:** wallet/support/admin backend services have real business-logic test coverage;
  a frontend Jest suite exists and runs in CI.
- **M11 Production:** `docker-compose up` from a fresh clone produces a fully working local stack;
  a CI pipeline blocks a deliberately-broken commit; a staging deployment is reachable from a real
  device off-network.

---

## 9. Things Missing That a Production Mental-Wellness Platform Should Have (Not Originally
Scoped, Worth Considering)

- **Data export / account deletion (GDPR-style "right to be forgotten")** — genuinely important
  for an app storing mood/journal/crisis data specifically; not found anywhere in either repo.
- **Crisis resource localization** — confirm crisis-escalation resources are appropriate for
  Ghana specifically (the app's stated market), not generic/US-centric hotline numbers.
- **Counsellor credential verification** — the counsellor approval flow was not audited for
  whether it verifies real credentials or is purely admin-judgment-based; worth confirming given
  the clinical-adjacent nature of the platform.
- **Session/data encryption at rest** — not verified in this pass; worth a dedicated check given
  the sensitivity of journal/mood/crisis data specifically.
- **Rate limiting on public endpoints** (especially the public institution catalogue and auth
  endpoints) — not found in this audit; standard hardening for any public-facing API.
- **Terms of Service / Privacy Policy in-app** — no evidence of either being surfaced anywhere in
  the frontend; required before any real user data collection at scale.

---

## Appendix — Corrections to the Prior Synthesis, With Evidence

| Prior claim | Verified reality |
|---|---|
| "Institution Management currently doesn't exist" | Fully built (entity, CRUD, public endpoint, admin UI) as of this session. What's missing is licensing/subscription linkage specifically, not the module itself. |
| "AI dual-model routing is uncommitted work" | Both Groq and Gemini are live in production code with automatic failover — this shipped since the tracker that claim came from. |
| "Admin Platform is the weakest part" | 8 of 9 tracker-defined modules are shipped and working. Its gaps are narrow (role-change, two edit forms, flag consumption), not structural. |
| "Community needs comments, replies, threading" | These are fully built server-side, arbitrarily-deep nested threading included. The actual gap is 100% frontend — no UI calls this backend at all. |
| "Premium system needs verification" | All 5 gated features were confirmed server-side-enforced in this pass, not just client-hidden. The real gap is business-model breadth (coupons, licensing, consultation fees), not verification of what exists. |
