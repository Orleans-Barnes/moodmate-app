# MoodMate Codebase Audit — July 21, 2026

Full read-only audit of both repos (14-microservice Spring Boot backend, React Native/Expo
frontend), followed by fixes for everything found that was safe to fix immediately. This covers
the state of the code as of backend commit `092091b` / frontend commit `ef7ae66`, plus the fixes
made during this audit.

## Issues found and fixed

### 1. Circular bean dependency crashing moodmate-wallet on startup (fixed earlier this session)
`WalletService` and `PaymentsService` injected each other, which Spring refused to start
("Requested bean is currently in creation"). `WalletService` now queries
`UserSubscriptionRepository` directly for the Pro-status check instead of going through
`PaymentsService`. Backend commit `0999b76`.

### 2. Admin sign-in was a dead end (fixed earlier this session)
The hidden 7-tap admin gesture on the role-select screen went straight to the one-time
`AdminSetup` screen. Once an admin account existed, that screen just alerted "already set up" and
sent the user back to role-select — with no way to reach a real sign-in form. `LoginScreen`
already had full admin support built in (including its own "Set up admin account" link for the
one-time case) but was never the gesture's target. Fixed to route to `Login` with role `ADMIN`.
Frontend commit `79fcc1e`.

### 3. GameScreen (Calm Match) awarded XP to the wrong store
It called `useAppState().addTreeXP()`, a local-only store not wired to the real gamification
system, instead of `useGamificationStore().awardXp()` — the store every other XP-awarding screen
actually uses. Players finishing this game were never getting real XP. Fixed. Also found: 6
screens (BubblePop, CheckIn, EditProfile, Game, Grounding, Pro, Shop) were missing safe-area
bottom padding on their scroll content, so content could get clipped behind the home indicator on
notched devices — added `insets.bottom` padding to all six. Frontend commit `0fa2615`.

### 4. Wellness Hub was completely unreachable
`HubScreen` — a fully built screen backed by a real API (admin-curated articles + RSVP events) —
was registered in navigation but had no button or link anywhere in the app that opened it. Added
a banner on the Explore screen next to the existing Wellness Library banner. Frontend commit
pending your confirmation (lock-file issue, command given above).

## Issues found, not fixed — flagged for your decision

These are real gaps but either need a product decision or non-trivial backend work, so I didn't
make a unilateral call on them.

**"Remove photo" in Edit Profile doesn't actually remove it.** Tapping it only clears an
unsaved, freshly-picked photo from local state. If you already have a saved avatar, the button
does nothing to it server-side — there's no `DELETE`/clear-avatar endpoint wired up yet
(`EditProfileScreen.tsx:109-114`, TODO already left in the code by a prior pass). Needs a small
backend endpoint plus frontend wiring. Estimate: small, roughly the size of one of the "Fix #"
items already done this session.

**Wellness Hub / chat's Supabase realtime layer is unconfigured.** `src/lib/supabase.ts` still
has placeholder project credentials. This is *not* a functional bug — chat's actual send/receive
path goes through the real MoodMate backend regardless, and the code already detects the
placeholder and gracefully falls back to 5-second polling instead of instant push updates. If you
want live-push chat, this needs a real Supabase project; otherwise it's fine to leave as-is
indefinitely.

**`moodmate-auth`'s Flyway migrations skip V2** (jumps straight from `V1__init_schema.sql` to
`V3__add_user_role.sql`). Flyway doesn't require contiguous numbering so this isn't breaking
anything, and renumbering already-applied migrations on a live database is actively risky
(checksum mismatches for anyone with an existing local DB) — flagging as historical trivia only,
recommend leaving alone.

## Everything else checked and came back clean

- **Gateway routing**: every backend `/api/**` endpoint across all 14 services has a matching
  gateway route, correctly ordered (public/narrow routes before broader authenticated ones).
- **Admin/internal endpoint security**: every admin-facing endpoint checks the caller's role;
  every true internal (service-to-service) endpoint is correctly kept off `/api/**` and
  unreachable through the gateway.
- **Cross-service HTTP clients**: all 11 `ServiceClientsProperties` records have their fields
  correctly mirrored in each service's `application.yml`, no orphaned config.
- **Other circular bean dependencies**: none found beyond the wallet one already fixed.
- **TODO/FIXME/HACK markers**: only the two already covered above (avatar removal, Supabase
  credentials) exist anywhere in either codebase.
- **Frontend navigation wiring**: every screen in `RootStackParamList` has a matching
  `<Stack.Screen>` and vice versa. Only two screens are unreachable: `GameScreen` (Calm Match —
  already a known, intentionally out-of-scope gap from earlier this session) and `HubScreen`
  (now fixed above).
- **API/DTO field consistency**: spot-checked several `src/api/*.ts` files against their backend
  DTOs — no mismatches found.
- **Premium gating consistency**: no screen advertises "Pro" features without actually checking
  `isPro` somewhere in the flow.
- **console.log statements**: only one, a harmless dev-timing log — nothing leaking tokens or
  sensitive data.
- **Secrets scan**: no API keys or credentials found committed to either repo's tracked files or
  history; `.env` and `start.bat` (which have held real secrets before) were never committed.

## What's left to complete

Per the original priority list, only **item 9** remains from the "6 → 9" batch: the
feature-flags-unused half (the mentor-approval-queue half was already done earlier this session).
Beyond that, the two flagged-not-fixed items above (avatar removal, Supabase config) are the only
known open gaps in the app as of this audit.

## Repo state

- Backend: pushed to GitHub `backend` branch (commit `092091b`); old monolith snapshot preserved
  under `backend-old-monolith-backup`.
- Frontend: pushed to GitHub `feature/phase-1D-personalized-dashboard` branch (commit `ef7ae66`
  as of the last push — three more commits made since, pending push: `0fa2615`, and the pending
  Hub-banner fix).
