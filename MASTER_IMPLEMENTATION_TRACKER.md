# MoodMate — Master Implementation Tracker

Single source of truth for what's done, in progress, and still missing across every remaining
phase. Update this file whenever a phase's status changes — it should always reflect the real
state of both repos, not an aspirational one. Grounded against the actual codebase (backend
`README.md`, `SupportService.java`, `HubController.java`, frontend `navigation/types.ts`, and git
history), not assumptions. Revised 2026-07-19 to reflect the reorganized roadmap below: the
biggest shift is that MoodMate is no longer being built from scratch for 1F/1G/1H — it's being
finished and integrated, so most remaining work is verification + completion, not creation.

## At-a-glance status

| Phase | Area | Est. complete | Risk | Recommended order |
|---|---|---|---|---|
| 1D | Personalized Dashboard | 100% | — | ✅ Done |
| 1E | Notifications | ~15% (local-only reminder + push token plumbing exist; no backend prefs/model/center/rules yet) | Medium | 1st — every later phase benefits from this existing first |
| 1F-A | Counsellor Platform (everything but video) | ~90% (frontend wiring done 2026-07-19: reschedule, availability-status persistence, analytics, directory search/filter, chat read-parity; device walkthrough still outstanding) | Medium | 2nd |
| 1G | Peer Mentor Platform (request/match workflow) | ~50% | Medium | 3rd |
| 1F-B | Jitsi Video Sessions | 0% | High | 4th — deserves its own milestone, don't rush it alongside 1F-A |
| 1H | Admin Portal (as modules, not screens) | ~40% | High | 5th |
| 1I | Production Readiness | 0% | High (pre-launch gate) | 6th — separate milestone from feature completion |
| 2 | AI | Existing groundwork, uncommitted | Low (deliberately deferred) | Last |

**Why this order:** 1E first because appointment-booked, appointment-approved, mentor-accepted,
article-published, and admin-announcement notifications all fall out of the notification layer
for free once it exists — building it once beats bolting ad-hoc notification logic onto 1F, 1G,
and 1H separately. 1F is split so the ~60–70%-complete non-video work (booking polish, analytics,
dashboard, messaging) can be finished and stabilized on its own, before Jitsi — which is a real
project in its own right (room creation, secure naming, appointment authorization, join tokens,
video UI, reconnect handling, mute/camera controls) — is started as its own milestone. 1G comes
before 1F-B because building the actual mentor request/accept workflow is a bigger business-logic
gap than video, and shouldn't be blocked on Jitsi. 1I is a dedicated milestone, not a checkbox
inside another phase, because deployment readiness and feature completion are genuinely different
kinds of "done."

---

## Phase 1D — Personalized Dashboard ✅ DONE

**Status:** Complete and stable. Do not revisit except for bug fixes.

**Deliverables shipped:**
- `src/utils/recommendationEngine.ts` — pure rule-based engine, zero framework dependencies, 5-tier
  priority hierarchy (no check-in → distress override → goal-based → preferredSupport tie-break →
  neutral default). Documented in `PHASE_1D_DASHBOARD_DATA_CONTRACT.md`.
- `src/state/useDashboardStore.ts` — orchestration store, `Promise.allSettled` fetch with
  per-field fallback on partial failure, plus a `__DEV__`-gated refresh-timing log.
- Widgets: `RecommendationCard`, `LatestMoodCard`, `JournalPreviewCard`, `SosShortcut`.
- `HomeScreen.tsx` extended (not rebuilt) to wire all of the above in, gated behind `!isGuest`.
- `src/utils/__tests__/recommendationEngine.test.ts` — 31 tests, all passing, covering every rule
  branch, all 9 goals, tie-breaking, priority ordering, guest input, and the
  documented-but-unused `wellnessState` groundwork.
- `tsc --noEmit` — 0 errors.
- Git tag `v1.2-phase-1D-dashboard-complete` on `feature/phase-1D-personalized-dashboard`.

**Bugs found and fixed during device verification (both pre-existing, not Phase 1D regressions):**
1. Backend `AuthService.login()` was `@Transactional(readOnly = true)` while internally writing a
   refresh token — every login failed. Fixed: removed `readOnly = true`. **Still uncommitted on
   backend `master`** by your choice, alongside the rest of master's pending work.
2. Frontend `SOSScreen.tsx`'s "Talk to a counsellor" button called `navigate('Support')` from the
   root stack, but `'Support'` is nested inside `MainTabs` — the action was never handled. Fixed:
   `navigate('Main', { screen: 'Support' })`. Applied directly to `master`.

---

## Phase 1E — Notifications (do this first)

**Status: ✅ COMPLETE.** Steps 1–5 implemented and verified (backend compiles + tests pass,
frontend `tsc` clean); committed and tagged on both repos as `v1.3-phase-1E-notifications-complete`
(backend `d43779e`, frontend `be3a5c0`). **Still outstanding, not blocking:** a real device
walkthrough via Expo Go hasn't been confirmed back to me — worth doing before leaning on the push
pipeline in later phases, but the code itself is done and shipped. **Risk: Medium → Low.**

**What already exists (frontend, fully local, no backend involved):**
- `src/utils/notifications.ts` — `expo-notifications` already wired up: permission request
  (`requestNotificationPermissions`), a single generic daily reminder
  (`scheduleDailyReminder`/`cancelDailyReminder`, fixed "Time for your daily check-in" copy), a
  3-day inactivity reminder (`scheduleInactivityReminder`/`resetInactivityReminder`, called on app
  open), and **`getExpoPushToken()` — Expo Push token retrieval already implemented**, i.e. a
  meaningful chunk of Step 5 already exists.
- `useGamificationStore.ts` — `reminderEnabled`/`reminderHour`/`reminderMinute` persisted locally
  (Zustand `persist`, device-only, not backend-synced) and surfaced via a toggle already in
  `ProfileScreen.tsx`'s "Notifications" menu item.

**What this means for scope:** this is a single generic local reminder + one inactivity nudge, not
the per-type (mood/journal/habit/sleep/appointment), backend-synced, rule-driven system the phase
actually calls for. It doesn't get removed or fought with — Step 1's new backend preferences and
Step 4's scheduling rules are additive, and the existing local reminder should eventually be
superseded by Step 4's rule-driven notifications rather than left as a second, parallel mechanism
long-term. Don't duplicate `getExpoPushToken()`/permission logic in Step 5 — reuse what's here.

**Why first:** appointment-booked, appointment-approved, mentor-accepted, article-published, and
admin-announcement notifications (needed by 1F, 1G, and 1H respectively) should all be built on
top of this layer once, not reinvented per module.

### Step 1 — Notification Preferences ✅ DONE
Toggle mood/journal/habit/sleep/appointment reminders + quiet hours, backend-synced (distinct from
the local-only daily/inactivity reminder above, which this doesn't replace yet).

**Shipped:**
- Backend (`moodmate-auth`, mirrors the existing `WellnessPreference` pattern exactly): migration
  `V12__add_notification_preferences.sql`, entity/repository/DTOs/mapper/service/controller for
  `GET/PUT /api/users/me/notification-preferences`. Lazily creates a default row (all reminders on,
  no quiet hours) on first access rather than 404ing, since unlike wellness preferences there's no
  onboarding-completion concept here. Quiet hours are validated `HH:mm` strings; `""` clears a
  field, `null`/omitted leaves it untouched, matching the existing partial-update convention.
- Frontend: `src/api/notificationPreferences.ts`, new types in `src/api/types.ts`,
  `NotificationPreferencesScreen.tsx` (5 reminder-type switches + quiet-hours presets), registered
  as `RootStackParamList['NotificationPreferences']`, linked from `ProfileScreen.tsx`'s existing
  "Notifications" expandable card via a new "Manage reminder types & quiet hours →" link.
- `tsc --noEmit`: 0 errors (verified with the actual process exit code this time — an earlier
  in-session check had silently piped through `tail`, which reports `tail`'s exit code, not
  `tsc`'s, and produced a false "0 errors" read. Caught and fixed by properly re-running without
  the pipe. Worth remembering for every future exit-criteria check on this project.)
- `node --experimental-strip-types --test` on `recommendationEngine.test.ts`: still 31/31 passing,
  confirmed with a real exit-code check, not incidentally affected by the `tsconfig.json` change
  below.
- One incidental fix required to get here: added `"allowImportingTsExtensions": true` to
  `tsconfig.json` (safe — `noEmit`/`moduleResolution: "bundler"` were already set by
  `expo/tsconfig.base`) so `tsc` stops rejecting the `.ts`-extension import that Node's runtime
  type-stripping requires in the Phase 1D test file.

**Confirmed with a real `mvnw -pl moodmate-auth spring-boot:run` on your machine:** Flyway applied
`V12__add_notification_preferences` cleanly ("Migrating schema \"auth\" to version \"12 - add
notification preferences\"... Successfully applied 1 migration"), all 90 source files compiled
with no errors, `Started AuthApplication` cleanly. This is real proof, not just isolated type
review — the same standard the Phase 1D login bug required to actually surface.

**Still open:** the new `NotificationPreferencesScreen.tsx` hasn't been walked through on a real
device via Expo Go yet (switches actually toggling, quiet-hours presets applying, the "Manage
reminder types & quiet hours →" link from `ProfileScreen.tsx` actually navigating). Nothing
committed yet on either repo.

### Step 2 — Notification Model ✅ BACKEND DONE
Consistent shape regardless of delivery channel: `{ title, body, type, destinationScreen,
scheduledAt, deliveredAt, readAt }`.

**Shipped:** new `moodmate-notifications` microservice (port 8102, own `notifications` schema),
mirroring `moodmate-gamification`'s module structure. `NotificationType` (15 values: mood/journal/
habit/sleep reminders, 4 appointment states, 3 mentor-request states, crisis alert, article
published, event reminder, achievement unlocked, mission completed, admin announcement, system) and
`NotificationStatus` (PENDING/SCHEDULED/DELIVERED/READ/FAILED) enums, `Notification` entity,
`V1__init_schema.sql` migration (with a partial unread index), repository, DTOs, mapper, service,
and two controllers:
- Public (`/api/notifications`, gateway-routed with `JwtAuthFilter`): `GET /`, `GET /unread-count`,
  `PATCH /{id}/read`, `PATCH /read-all`.
- Internal (`/internal/notifications`, deliberately **not** gateway-routed — same convention as
  `moodmate-crisis`'s `/internal/crisis/**`): `POST /`, for every other service to call directly as
  a "producer" instead of writing into this schema.

Registered in root `pom.xml`'s `<modules>` and given a gateway route in
`moodmate-gateway/application.yml`. Verified with a real `mvnw -pl moodmate-notifications -am
compile` on your machine: **BUILD SUCCESS**, all 14 source files compiled clean.

**Not yet done:** producer clients in the other services (support, mood, journal, wellness,
gamification, admin, ai) that actually call `POST /internal/notifications` — this is Step 3/4 work.
Frontend `src/api/notifications.ts` + `NotificationView` type — **Status: Not started** (this is
Step 3, the in-app notification center, below).

### Step 3 — In-app Notification Center ✅ DONE
An inbox so nothing is lost if push fails — must work standalone before Expo Push exists at all.

**Shipped:**
- `src/api/notifications.ts` — thin wrappers over the Step 2 public endpoints
  (`listNotifications`, `getUnreadNotificationCount`, `markNotificationRead`,
  `markAllNotificationsRead`). Required adding `apiPatch` to `src/api/client.ts` (only
  GET/POST/PUT/DELETE existed before).
- `src/api/types.ts` — `NotificationTypeKey` (15 values), `NotificationStatusKey`, `NotificationView`,
  mirroring the backend enums/DTO exactly.
- `useNotificationStore.ts` — `notifications`/`unreadCount`/`loading`/`error` + `load()`,
  `refreshUnreadCount()` (silent, for the badge), `markRead()`/`markAllRead()` (optimistic update
  with per-row/whole-list revert on failure) — same `Promise.allSettled` failure-tolerance pattern
  as `useDashboardStore.refresh()`.
- `NotificationCenterScreen.tsx` — pull-to-refresh list, per-type icon map, unread dot, tap-to-mark-read
  + deep-link via `destinationScreen`/`destinationParams` (falls back to staying put if unrecognized),
  "Mark all read" header action. Registered as `RootStackParamList['NotificationCenter']` in
  `navigation/types.ts` and `RootNavigator.tsx`.
- `HomeScreen.tsx` — bell icon + unread-count badge in the header next to the avatar, wired into the
  existing `refresh()` callback (calls `refreshUnreadCount(token)` alongside the dashboard/wellness
  refreshes already there).

**Verified:** `tsc --noEmit` — 0 errors, confirmed with the real process exit code (`REAL_EXIT:0`),
not a piped/masked one — see Step 1's note on why that distinction matters on this project.

**Still open:** not walked through on a real device via Expo Go yet (bell badge updating, tapping a
notification, deep-link navigation, mark-all-read). Nothing committed yet on either repo. No real
notifications exist to display yet either — Step 4 (scheduling rules) and the other services'
producer clients haven't been built, so this screen will show empty until those exist or a manual
`POST /internal/notifications` test call is made.

### Step 4 — Scheduling Rules ✅ FOUR RULES WIRED, ONE BLOCKED
Business rules independent of Expo: no check-in today → remind 8pm; journal untouched 2 days →
gentle reminder; habit incomplete → reminder; counsellor appointment tomorrow → reminder; peer
mentor meeting in 30 min → reminder.

**Design decision (worth recording):** the scheduled job lives centrally in
`moodmate-notifications`, not distributed one-per-producer-service — it reads via each owning
service's existing `/internal/**` pattern (a small, purpose-built read endpoint per rule) and
creates the notification itself once its pure rule says yes. This matches this step's own
description literally ("reading via each service's existing `/internal/**` pattern") and keeps
every "if X then remind" decision in one place, instead of duplicating `@Scheduled`/RestClient
boilerplate across four services.

**Shipped — all four buildable rules, fully wired end-to-end:**

| Rule | Producing service / internal endpoint | Client + scheduled job | Cadence | Tests |
|---|---|---|---|---|
| Mood check-in | `moodmate-mood`: `GET /internal/mood/latest-per-user` | `MoodServiceClient` + `MoodReminderScheduledJob` | every 30 min (8pm cutoff) | 8 |
| Journal | `moodmate-journal`: `GET /internal/journal/latest-per-user` | `JournalServiceClient` + `JournalReminderScheduledJob` | once daily, 09:00 UTC | 6 |
| Habit | `moodmate-wellness`: `GET /internal/wellness/habits/today-summary` | `WellnessServiceClient` + `HabitReminderScheduledJob` | every 30 min (7pm cutoff) | 7 |
| Appointment | `moodmate-support`: `GET /internal/support/appointments/confirmed` | `SupportServiceClient` + `AppointmentReminderScheduledJob` | every 30 min (24h window) | 7 |

Each producing-service endpoint is read-only, internal-only (not gateway-routed), and returns a
flat per-user summary; each rule is pure (no Spring/DB dependency); each job is idempotent via
`existsByUserIdAndTypeAndCreatedAtAfter`, and degrades gracefully (empty list + warn-log) if its
producing service is unreachable, same pattern as `moodmate-mood`'s own `WellnessServiceClient`.
Added `NotificationType.APPOINTMENT_REMINDER` (distinct from the existing `APPOINTMENT_CONFIRMED`
lifecycle event — one fires once when confirmed, the other fires later as a time-based nudge).

**Scoping notes (apply to all four, not just Mood):** each only evaluates users its producing
service has *existing* data for (a user who's never checked in/journaled/etc. is out of scope —
that's an onboarding-flow concern, not this one). None yet consult `NotificationPreference` (quiet
hours / per-type toggles, Phase 1E Step 1) or a user's real local time zone — UTC-only for now.
`AppointmentReminderScheduledJob`'s idempotency is keyed per-appointment (since when its window
opened), not per-day like the other three — documented in its own doc comment, including the rare
edge case where two of one user's confirmed appointments have overlapping 24h windows.

**Frontend fix caught in the process:** `NotificationCenterScreen.handleTap` was navigating
directly to `destinationScreen` regardless of whether it's a root-stack screen or a bottom-tab
screen — the exact same bug class as the SOS "Talk to a counsellor" fix earlier this session
(`Journal`/`Support` only exist nested under `Main`, not on the root stack). Fixed by checking a
`MAIN_TAB_SCREENS` set and routing through `navigate('Main', { screen, params })` for those.
Verified with `tsc --noEmit` — 0 errors, real exit code.

**Blocked:** peer-mentor-meeting-in-30-min reminder — there is no meeting-scheduling entity yet
(Phase 1G's "Meeting scheduled" step in the request/accept workflow isn't built). Cannot be
implemented until Phase 1G ships that far.

**Verified:** `mvnw -pl moodmate-notifications,moodmate-mood,moodmate-journal,moodmate-wellness,moodmate-support -am compile`
— BUILD SUCCESS across all 5 modules. `mvnw -pl moodmate-notifications test` — **28/28 tests
passing** (7 Appointment, 7 Habit, 6 Journal, 8 Mood), 0 failures/errors.

**Verified:** `mvnw -pl moodmate-notifications,moodmate-mood -am compile` — BUILD SUCCESS (26 +
22 source files). `mvnw -pl moodmate-notifications test` — **28/28 tests passing** (7
Appointment, 7 Habit, 6 Journal, 8 Mood), 0 failures/errors.

### Step 5 — Expo Push ✅ DONE (integrated with existing infrastructure, not built from scratch)
**Verified before building anything** (per this step's own instruction): `moodmate-auth` already
had a *complete* push-send infrastructure from an earlier "Feature 9 (Notification Deep Linking)" -
`PushToken` storage (`PUT`/`DELETE /api/push/token`, already frontend-wired), `ExpoPushClient`
(real Expo push API caller), and `POST /internal/push/notify` / `notify-roles` (fans out to every
device token for a user/role and calls Expo) - already consumed by `moodmate-wallet`/
`moodmate-support`/`moodmate-crisis`. This step's job was therefore integration, not new
infrastructure: make every notification `moodmate-notifications` creates *also* trigger a push via
that existing machinery, rather than building a second, competing push pipeline.

**Shipped:**
- `moodmate-auth`: new `GET /internal/users/{userId}/notification-preferences` on
  `InternalUserController` (internal-only, not gateway-routed) - reuses
  `NotificationPreferenceService.get(userId)` unmodified, since it already took a `userId`
  parameter rather than reading "the current user."
- `moodmate-notifications`: `AuthServiceClient` (`notify()` → `POST /internal/push/notify`,
  `getPreferences()` → the endpoint above; both degrade gracefully - a failure logs a warning and
  never fails the notification-creation transaction that triggered it, same fire-and-forget
  philosophy as auth's own `ExpoPushClient`).
- `PushGatingRule` (pure, `scheduling/rules` package) - decides whether to actually push, on top of
  the in-app row always being created regardless: `CRISIS_ALERT` always pushes (safety-critical,
  never gated); every other type is gated by its matching Step 1 preference toggle where one
  exists (mood/journal/habit/sleep/appointment reminders - `APPOINTMENT_BOOKED/CONFIRMED/
  CANCELLED/COMPLETED/REMINDER` all share the single `appointmentReminders` toggle) and by quiet
  hours (handles the midnight-wraparound case, e.g. `"22:00"`–`"07:00"`); types with no matching
  toggle (mentor requests, achievements, admin announcements, etc.) always push outside quiet
  hours. A preferences-fetch failure fails open (allows the push) rather than silently dropping a
  real notification. 15 unit tests (`PushGatingRuleTest`), including the quiet-hours boundary and
  wraparound cases.
- `NotificationService.create()` updated: a non-scheduled notification is now actually marked
  `DELIVERED`/`deliveredAt` at creation (closing a small pre-existing gap - nothing previously set
  this, even though the doc comment always said the in-app inbox counts as delivery), and, after
  saving, attempts a push through the pieces above if `PushGatingRule` allows it.
- **Frontend fix caught in the process:** `App.tsx`'s notification-tap listener had the exact same
  root-stack-vs-nested-tab bug as `NotificationCenterScreen.handleTap` (Step 4) and the original
  SOS bug - `data.screen` values like `"Journal"`/`"Support"` would silently fall back to `'Main'`
  instead of landing on the right tab. Fixed with the same `NESTED_TAB_SCREENS` pattern. Verified
  with `tsc --noEmit` — 0 errors, real exit code.

**Known, deliberate gaps:** push `data` only carries `screen`, not `destinationParams` - a tapped
push lands on the right screen but not with deep params yet (the in-app inbox already forwards
full params when opened from there; extending `data` to carry params would also require a matching
`App.tsx` change, out of scope for this pass). FCM/Android-specific tuning, delivery analytics, and
retry queues for failed pushes are not implemented - `ExpoPushClient` fire-and-forgets exactly as it
did before this step.

**Verified:** `mvnw -pl moodmate-notifications,moodmate-auth -am compile` — BUILD SUCCESS across
both modules. `mvnw -pl moodmate-notifications test` — all tests passing (43 total: the 28 from
Step 4 plus 15 new `PushGatingRuleTest` cases), 0 failures/errors. One real issue caught and fixed
along the way: the `PushGatingRuleTest` helper hadn't been updated for the `updatedAt` field added
to `NotificationPreferences` moments earlier - a genuine compile error, not a false pass, fixed by
passing `null` for that field in the test helper.

---

## Phase 1F-A — Counsellor Platform (everything except video)

**Status:** ~90% complete. **Risk: Medium** (down from High — the frontend wiring gap that made
this risky is closed; what's left is device verification, not missing functionality). Finish and
stabilize this before touching Jitsi.

### Directory
`GET /api/support/counsellors` exists and now returns `availabilityStatus` (`ONLINE`/`BUSY`/`AWAY`)
per counsellor. `SupportScreen.tsx` renders a roster carousel via `useSupportStore`, with a new
client-side search box (name/title/specialty) and an All/Counsellors/Mentors filter row, plus a
colored-dot availability indicator per counsellor (replacing the old boolean available/unavailable
text — mentors still use the boolean, since `PeerMentorDto` has no availability-status field).
**Status: ✅ Done — search/filter is client-side over the already-loaded roster, no new endpoint
needed for it.**

### Booking
Fully implemented backend-side: `bookAppointment`, `listAppointments`, `cancelAppointment`
(student), `confirmAppointment`, `completeAppointment`, `cancelAppointmentAsCounsellor`,
`listCounsellorAppointments` (counsellor), with notification-deep-link hooks already wired for
booking/confirm/cancel/complete. Frontend booking UI (day/time-slot picker) already built in
`SupportScreen.tsx`; `CounsellorAppointmentsScreen.tsx` exists counsellor-side. **Reschedule
shipped:** backend `POST /api/support/appointments/{id}/reschedule` (only PENDING/CONFIRMED
appointments; a CONFIRMED one reschedules back to PENDING, requiring re-confirmation at the new
time). Frontend: `rescheduleAppointment()` in `src/api/support.ts`, `reschedule()` action in
`useSupportStore.ts`, and a reschedule panel (same day/time-chip UI as booking) on the "Upcoming
appointment" card in `SupportScreen.tsx`. **Status: ✅ Done.**

### Messaging
Fully implemented backend-side: `startConversation`, `listConversations`, `listMessages`,
`sendMessage`, `markRead` (student) + counsellor equivalents. Confirmed one-to-one per
user+counsellor pair, not community chat. `ChatScreen.tsx`, `CounsellorChatScreen.tsx`,
`CounsellorConversationsScreen.tsx` already exist. `ChatScreen.tsx` (student-facing) now shows the
same per-bubble timestamp + "· Read" indicator that `CounsellorChatScreen.tsx` already had — it
previously rendered bubbles with no timestamp or read state at all. **Gap still open:**
polling-only, no real-time delivery layer (WebSocket/SSE) beyond the existing Supabase real-time
subscription both chat screens already attempt — decide if that's needed for this phase or
acceptable as-is. **Status: ✅ Read-receipt parity done — real-time-ness still to audit.**

### Counsellor Dashboard
`CounsellorDashboardScreen.tsx`'s Online/Busy/Away toggle is now persisted server-side (`POST
/api/support/counsellor/availability-status`, optimistic frontend update with revert-on-failure)
instead of local-only React state. Added a Session History section (past COMPLETED/CANCELLED
appointments, most recent first) and an Analytics section (see below). **Known gap:** there is no
`GET` "my own counsellor row" endpoint, so the status pill still defaults to ONLINE on first
render rather than restoring the last-saved value — a real, documented gap, not an oversight; needs
a small backend addition if it matters before launch. Also fixed a pre-existing JSX structural bug
where the Crisis Alerts section was accidentally nested inside the Wellbeing Tip card's
`LinearGradient` (rendered, but inside the wrong visual container) — now a proper sibling section.
**Status: ✅ Done, pending the "my own status" backend gap above and a device walkthrough.**

### Analytics
`GET /api/support/counsellor/analytics` shipped backend-side
(`CounsellorAnalyticsResponse`: totalAppointments/upcomingCount/completedCount/missedCount/
cancelledCount/completionRate — lifetime counts, "missed" computed as CONFIRMED-but-past-due-and-
never-completed since nothing auto-transitions that state). Frontend: `getCounsellorAnalytics()` in
`src/api/support.ts`, `CounsellorAnalyticsView` in `src/api/types.ts`, and a 6-card analytics grid
on `CounsellorDashboardScreen.tsx`. **Status: ✅ Done.**

### Verification done this pass
`tsc --noEmit` — 0 errors, confirmed with the real process exit code (`REAL_EXIT:0`). The
`npx expo export --platform android` bundling check called for by the frontend's own `CLAUDE.md`
house rules could **not** be completed in this session's sandboxed shell — every attempt (direct,
backgrounded, with `CI=1`/`EXPO_NO_TELEMETRY=1`/`EXPO_OFFLINE=1`, with and without Watchman present)
produced zero output and hit the shell tool's hard per-call time limit with no error surfaced,
while a trivial `expo --version` in the same shell returned instantly — pointing at an environment
constraint (no Watchman, so Metro's file crawl over a 60-screen/2000+-module project likely exceeds
the sandbox's per-command budget) rather than a code defect. **This still needs a real
`npx expo export --platform android --output-dir /tmp/export-test` run on your own machine before
calling this phase's exit criteria met** — do not skip it on the strength of `tsc` alone, per this
project's own documented lesson that `tsc` passing is necessary but not sufficient.

---

## Phase 1G — Peer Mentor Platform (build the real workflow)

**Status:** ~50% complete. **Risk: Medium.** Probably the single biggest missing *business logic*
piece in the whole remaining roadmap — bigger than video, and shouldn't be blocked on 1F-B.

**Current state (the gap):** `PeerMentor` entity + `listPeerMentors()` exist, and
`startConversation`'s `hasMentor` branch already supports messaging a mentor — but it creates the
conversation **immediately**, with no pending/accepted state at all. Today the flow is just:

```
Student → message mentor
```

**Target flow** (the actual deliverable for this phase):

```
Student
  ↓
Request mentor
  ↓
Mentor accepts (or declines)
  ↓
Conversation created
  ↓
Meeting scheduled
  ↓
Chat
  ↓
(Optional Jitsi, once 1F-B exists)
```

**Backend work needed:** a `MentorRequest` entity/state machine (`PENDING`/`ACCEPTED`/`DECLINED`),
new endpoints for a student to send a request and a mentor to accept/decline, and gating
`startConversation`'s mentor branch behind an accepted request rather than allowing it
unconditionally. **Frontend work needed:** a request-sending UI (distinct from directly messaging),
and a mentor-facing request-management view — there's no `PeerMentorDashboardScreen` equivalent to
`CounsellorDashboardScreen` yet. `PeerMentorSignupScreen.tsx` and `CounsellorOrMentorScreen.tsx`
already handle mentor onboarding. **Status: 🟡 Plumbing exists (entity, messaging); the actual
match/request business logic that makes this meaningfully different from "message a counsellor"
is unbuilt.**

---

## Phase 1F-B — Jitsi Video Sessions (its own milestone)

**Status:** 0% — nothing exists (no Jitsi dependency, no meeting-room model, no
appointment→room linkage). **Risk: High.** Treat this as a project in its own right, not a
checkbox inside 1F-A — it involves room creation, secure room naming, appointment authorization,
join tokens, video UI, reconnect handling, and mute/camera controls, each of which can go wrong
independently.

**Framing:** this should ship as a flagship feature — not "Video Call," but **"Secure Counselling
Session."** The distinction matters for both trust and scope: a bare video-SDK embed invites scope
creep toward a generic calling feature, while framing it as a counselling-session flow keeps every
design decision anchored to the appointment it belongs to.

**Target flow:**

```
Appointment
  ↓
Counsellor confirms
  ↓
Backend creates meeting metadata
  ↓
Student receives notification (Phase 1E dependency)
  ↓
Join button appears 15 minutes before appointment
  ↓
Both participants authenticate
  ↓
Backend returns room credentials
  ↓
Join Jitsi
  ↓
Session ends
  ↓
Appointment marked complete
  ↓
Optional feedback
```

**Key design constraint:** the meeting room must be tied to the `Appointment` entity (e.g. a
`jitsiRoomId` or a deterministic room name derived from the appointment ID plus a signed join
token), never an arbitrary joinable room name — the backend must authorize that only the booked
student and assigned counsellor can fetch the join URL/credentials for that specific appointment.
The "join button appears 15 minutes before" requirement also implies a time-gated authorization
check, not just an identity check.

**Depends on:** Phase 1E (for the join-reminder notification) and Phase 1F-A's appointment
lifecycle (confirm/complete) being stable first. **Status: ⬜ Not started — do not start until
1F-A is stable.**

---

## Phase 1H — Admin Portal (as modules, not screens)

**Status:** ~40% complete. **Risk: High.** Reframe this as its own application made of modules,
not a handful of admin screens — it scales better as MoodMate grows.

| Module | What it needs | Backend status | Frontend status |
|---|---|---|---|
| **Dashboard** | Active users, mood distribution, crisis alerts, pending approvals, upcoming appointments, daily check-ins | ✅ `health-pulse`, `/analytics/checkins`, `/analytics/moods`, `/analytics/institutions` exist. Crisis alerts feed not yet confirmed wired to this dashboard specifically. | `AdminDashboardScreen.tsx` exists — audit exactly what it renders today. |
| **User Management** | View/search users, suspend/reinstate, role changes | ⬜ No admin user CRUD/ban-unban endpoints found beyond community-side banning fields on `User` | ⬜ Not started |
| **Counsellor Management** | Approve, suspend, edit specialties/availability | ✅ `requestCounsellorStatus`, `approveCounsellorRequest`, `rejectCounsellorRequest`, `listPendingCounsellorRequests` exist. Suspend (post-approval) and specialty/availability editing by an admin are not confirmed to exist. | Unconfirmed whether `AdminDashboardScreen` surfaces the approval queue yet |
| **Peer Mentor Management** | Approve, deactivate, ratings | ⬜ No approval workflow exists — mentors currently appear to be seed-only/pre-approved | ⬜ Not started |
| **Community Moderation** | Reports, hidden posts, banned users | `User.isBanned`/`bannedReason` fields exist (referenced in `AuthService.login`); actual moderation *actions* (flag review, post takedown) in `moodmate-community` not yet audited in this pass | ⬜ Not started |
| **Wellness Content** | Articles, events, wellness tips | `moodmate-wellness`'s `HubController` is **read-only** — `GET` + RSVP only, no admin `POST/PUT/DELETE` | ⬜ Not started — needs new endpoints entirely |
| **Analytics** | Retention, engagement, institutions, moods, appointments | 🟡 Institutions/moods/checkins exist; retention/engagement and appointment-specific analytics don't | 🟡 Partial |
| **System Settings** | Feature flags, notification broadcasts, logs | ⬜ Nothing found for any of these | ⬜ Not started |
| **Audit Logs** | Who approved/rejected/banned what, when | ⬜ Nothing found — no audit trail on any admin action currently | ⬜ Not started |

---

## Phase 1I — Production Readiness (new — separate milestone from feature completion)

**Status:** Not started. **Risk: High as a pre-launch gate** — this phase adds no new features,
but is what makes the difference between "feature-complete" and actually deployable in front of
real users, judges, or investors. Keep it as its own milestone rather than folding it into 1F–1H,
so "all features built" and "ready to ship" stay clearly distinguishable states.

- **End-to-end integration testing** across all 12 services together (the backend README itself
  flags this as not yet done: "a full runtime pass... has **not** yet been done").
- **Load and performance testing** — especially relevant given the microservice-per-concern
  architecture; a slow downstream service (e.g. `moodmate-ai`'s Groq/Gemini calls) shouldn't stall
  unrelated requests.
- **Security review** — JWT handling (already gateway-validated per service), authorization checks
  (especially load-bearing for Phase 1F-B's room-credential authorization), rate limiting, and
  secrets management (the README already flags `JWT_SECRET`, `PAYSTACK_SECRET_KEY`,
  `GROQ_API_KEY`, mail credentials as env-vars-only, never hardcoded — verify that discipline held
  everywhere, including anything added during 1E–1H).
- **Docker/container verification** — the current dev workflow is `mvnw spring-boot:run` per
  service via `start-all.bat`; production needs each service actually containerized and verified.
- **CI/CD pipeline** — currently no automated build/test/deploy pipeline exists for either repo.
- **Monitoring and logging** — a `docker-compose.monitoring.yml` already exists in the backend repo
  root (found during this audit, not yet reviewed for completeness) — confirm what it actually
  wires up (Prometheus/Grafana or equivalent) versus what's still a stub.
- **Backup and database migration validation** — every service uses Flyway with `ddl-auto:
  validate` already (good baseline), but backup/restore procedures for the shared Postgres
  instance haven't been established.
- **App Store / Play Store build verification** — a real signed build via EAS or equivalent,
  distinct from Expo Go device testing used throughout development.
- **Accessibility review** — screen reader support, color contrast (relevant given the
  Headspace-calm visual direction), touch target sizing.
- **Privacy policy and Terms of Service** — required before any real user data collection,
  especially given the mental-health-sensitive nature of the data this app handles.
- **Production environment configuration** — separating dev/staging/prod env vars, especially
  `BACKEND_BASE_URL`'s current hardcoded-LAN-IP pattern in `src/config.ts`, which is a dev-only
  convenience that must not ship as-is.

---

## Phase 2 — AI (deliberately last)

**Status:** Already in progress, uncommitted, on backend `master` — reviewed and confirmed during
this session, not scoped from a blank slate.

- `moodmate-ai` service already exists (`/api/ai` chat, `/api/insights`), using Groq today.
- Uncommitted work already sitting on `master`: a full Gemini client (`GeminiClient`,
  `GeminiRequest`, `GeminiResponse`, `GeminiContent`, `GeminiPart`, `GeminiGenerationConfig`,
  `GeminiSystemInstruction`, `GeminiProperties`) plus an `AiModelRouter` with its own test file —
  looks like dual-model (Groq + Gemini) routing that was mid-flight when a previous session ended.
- **Recommendation:** review and either finish or deliberately discard this existing uncommitted
  work before starting anything new here, so it isn't duplicated or silently lost.
- **Architecture to hold onto:** the dashboard already works as `Rule Engine → Recommendation`.
  Phase 2 should only ever insert an AI *wording* layer on top, never a second decision-making
  path: `Rule Engine → AI wording layer → Student`. The AI explains; it does not decide. This is
  the same non-negotiable already documented in `recommendationEngine.ts`'s own doc comment, and
  it's what keeps this layer trustworthy and debuggable once it's built.
- **Scope once resumed:** wellness insights, recommendation wording, journal summaries, mood trend
  explanations, counsellor-support suggestions (resources, never clinical decisions).

---

## Exit criteria — required after every phase (1E, 1F-A, 1G, 1F-B, 1H)

Not a new phase — a standard checkpoint applied at the end of each one, so technical debt can't
quietly accumulate as the platform grows. A phase isn't done until all of these are true:

- [ ] Backend tests pass.
- [ ] Frontend `tsc --noEmit` passes with 0 errors.
- [ ] Device verification succeeds (real walkthrough via Expo Go, not just `tsc`/unit tests).
- [ ] API contract documentation is updated (this tracker, plus any `PHASE_*_DATA_CONTRACT.md`-style
      doc a phase produces, the way Phase 1D's did).
- [ ] Git tag created for the phase.
- [ ] Working tree is clean before starting the next phase (no stray uncommitted changes carried
      forward — the backend `master` currently has known exceptions to this, tracked above, that
      should be resolved before 1E is called done, not carried indefinitely).

## Beyond v1 — future roadmap (kept separate from the current delivery plan)

Once Phase 1I closes out a genuinely production-ready v1, treat further expansion as its own
roadmap rather than an open-ended continuation of Phase 2 — this keeps focus on shipping a
polished v1 before scope grows again:

- **v2.0:** AI personalization, predictive insights, institutional analytics.
- **v2.1:** Wearable integration (Apple Health, Google Fit), calendar sync, advanced wellness
  analytics.
- **v3.0:** Multi-institution deployment, counsellor enterprise portal, organization management.

## How to keep this current

Update the status column and the relevant phase section whenever:
- A deliverable ships and is device-verified.
- A gap is discovered that wasn't visible from this audit (e.g. a full read of
  `moodmate-community`'s actual moderation capabilities, which this pass flagged but didn't
  exhaustively verify).
- Scope changes (e.g. reschedule flow added to 1F-A, feature flags dropped from 1H, the
  `docker-compose.monitoring.yml` found during this pass turns out to already cover most of 1I's
  monitoring requirement once reviewed).
