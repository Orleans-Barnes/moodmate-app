# MoodMate — Implementation Roadmap

_Last updated: 2026-06-29_

## Where things stand right now

**Phase 0 and Phase 1 are both done and committed**, backend and frontend. Login and Signup now call the real API, store the token securely on-device, and Splash auto-resumes a saved session. Profile shows the real logged-in user and logout actually clears the session. Not yet done: testing signup/login/guest on the actual phone against the real backend — do this before starting Phase 2 (see guardrail: "each phase gets verified on your actual device before the next one starts").

Most domain screens beyond auth (journal entries, tree XP, streaks) still run on local mock state (`useAppState`), not persisted data — that's Phase 3.

## Why the order matters

Two specific things go wrong if built in the wrong order:

1. Building counsellor or admin features before "role" exists on a user means retrofitting access control into things that already shipped.
2. Building more backend domains before the frontend can actually authenticate against them means nothing can be tested end-to-end — bugs surface late and are hard to trace back to their source.

The phases below are ordered specifically to avoid both.

## Phase 0 — Confirm the base actually works

Do this before anything else gets built on top of it:

1. ~~Resolve the port 8080 conflict~~ — done. `mvnw.cmd spring-boot:run` now starts cleanly and logs `Started MoodmateBackendApplication`.
2. Re-test `/actuator/health` from the phone — confirm it now returns 200, not 500. **This is the one remaining item before Phase 0 is fully closed out.**

This is Task #10 in the tracker. Nothing in Phase 1 should start until step 2 above is confirmed.

## Phase 1 — Role & real authentication (backend + frontend, as one unit)

This is the foundation everything else depends on, so it should ship as one paired piece of work, not "backend now, frontend later":

- **Backend — done, verified, committed.** `V3__add_user_role.sql` adds `role` (VARCHAR + CHECK, defaults `STUDENT`) to `users`. New `Role` enum (`STUDENT`/`COUNSELLOR`/`ADMIN`). `User` entity carries the field. The JWT now embeds the role as a claim and `JwtAuthenticationFilter` turns it into a Spring Security authority (`ROLE_STUDENT`, etc.) so Phase 2 can gate endpoints with `hasRole(...)` later without touching the filter again. Signup and guest-login always force `STUDENT` server-side — a client can never request a different role. `UserProfileResponse` now includes `role`. Migration applied and `mvnw.cmd spring-boot:run` started clean.
- **Frontend — done, type-checked, committed.** Login and Signup screens call the real API (replacing the old toast-only stubs). Token + user profile are persisted via `expo-secure-store` (`src/state/useAuthStore.ts`). Splash checks for a saved session on launch and skips straight to the app if one exists. Every role currently lands on the same `Main` experience — that's the intentional seam for role-based routing once counsellor/admin screens exist in Phase 2. **Still to do:** verify signup/login/guest actually work end-to-end on your phone against the real backend (the `expo export` bundle smoke test couldn't complete in the dev sandbox, so a real device run is the verification step here).

Building these together is what prevents the two repos from drifting on what a "user" object even looks like — that drift is the most common source of integration bugs in apps like this.

Two related items deliberately deferred, not forgotten:
- `/api/auth` is not yet renamed to `/api/v1/auth`. Versioning just the auth controller now would leave every other controller inconsistently un-versioned — that rename should happen once, across all controllers, in its own pass.
- The existing `counsellors`/`peer_mentors` tables (in the `support` package) are still just a roster with no login of their own. Deciding how a counsellor gets an actual `role = COUNSELLOR` account — and whether that links back to a `counsellors` row — is Phase 2 work.

## Phase 2 — Counsellor / mentor feature set (Task #6)

Depends on Phase 1 being real and verified — a counsellor account has to genuinely exist and authenticate before features can be gated to it.

## Phase 3 — Remaining student-facing domains (Task #7)

**Journal first.** It already has the most complete frontend (entries, templates, the calendar strip fixed today) and anchors the tree-growth/streak system, so wiring it to a real, persisted backend validates the entire auth pipeline against a meaningful feature rather than a toy one. Community, Explore, and Support follow after, in that rough order.

## Phase 4 — Admin web dashboard (Task #8) — conditional

Still an open decision on whether to build this at all. Revisit once Phases 1–3 are stable — designing it earlier risks building it against domain data models that haven't settled yet.

## Designing now for a future microservices split

The requirement is that this project eventually runs as microservices. Building actual separate services right now — before Phases 1–3 even exist — would mean network calls, separate deployments, and service discovery for an app with no users yet and one developer. That cost buys nothing yet. So the approach is: build a **modular monolith** — one Spring Boot app, but internally split along the exact same boundaries a microservices version would use — so the eventual split is a mechanical extraction later, not a rewrite.

Service boundaries (these mirror the phases above):
- **Auth/User** — accounts, roles, JWT issuance
- **Journal** — entries, templates, streaks/XP
- **Counsellor** — mentor matching, sessions
- **Community** — posts, groups, moderation
- **Admin** — (Phase 4, if built)

Rules to follow from Phase 1 onward, regardless of when the real split happens:

1. One Java package per domain. Nothing in one domain's package imports an entity or repository belonging to another domain.
2. Cross-domain reads or writes go only through that domain's public service interface — never a direct repository call into someone else's tables.
3. Cross-domain side effects (e.g. a journal entry updating streak/XP) go through Spring's `ApplicationEventPublisher`, not a direct method call. This is the same shape as publishing to a message queue later — swapping the publisher for Kafka/RabbitMQ becomes a config change, not a redesign.
4. Each domain gets its own Flyway migration prefix, even though everything runs against one database for now. Splitting the database later becomes a copy operation instead of a redesign.
5. All REST endpoints stay under `/api/v1/<domain>/...`. An API gateway can later route each prefix to its own service without the frontend noticing anything changed.
6. Auth stays centralized — tokens issued by the Auth domain, verified by everyone else off the JWT signature. Auth is usually the first thing extracted into its own service, and this is what makes that possible without touching the others.

Actual extraction should wait until Phases 1–3 are stable and there's a concrete reason — a specific domain needing to scale or deploy independently. Splitting early, before real usage patterns are known, risks drawing the boundaries in the wrong place and having to redo it anyway.

## Guardrails — what actually prevents future bugs/inconsistency

- One Flyway migration per change, never edited after it has run. Schema drift here is the hardest category of bug to recover from.
- Each phase gets verified on your actual device before the next one starts.
- A git commit at every stable checkpoint, so any step has a clean rollback point.
- The backend DTO and the frontend TypeScript type for the same piece of data get written together, in the same sitting — this is specifically what prevents frontend/backend shape mismatches.
