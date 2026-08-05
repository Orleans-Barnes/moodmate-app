# Phase 1D Implementation Plan

## Important correction before any build order: HomeScreen is not a blank slate

Before proposing a build sequence, I checked the actual state of
`src/screens/home/HomeScreen.tsx` (951 lines) rather than assuming Phase 1D starts from nothing.
It doesn't. Already built and already wired to real backend data, confirmed by reading the file
and its stores directly:

- **Streak / XP / tree stage** — `useWellnessStore` already calls the real `GET /api/wellness/state`
  (`src/api/wellness.ts` → `src/state/useWellnessStore.ts`).
- **Daily goals checklist** — `GoalRow.tsx` already renders `todaysGoals` from that same real
  state, with toggle wired to the real `POST /api/wellness/goals/{key}/toggle`. This already *is*
  the "Daily Wellness Journey" concept from the revised scope — it doesn't need to be built again,
  just extended (see below).
- **Achievements/badges** — `useGamificationStore` already calls the real
  `GET /api/gamification/achievements/mine`.
- **Quick actions grid** — Check-in and Journal tiles already exist and navigate to the real
  `CheckIn` and `Journal` screens, with a `done`-today indicator already computed locally.

**What genuinely does not exist yet**, confirmed by grep against the same file:
- No reference anywhere to the new profile data (`wellness-preferences` goals/preferredSupport
  from Phase 1C-iii) — the dashboard has no idea what the student said they cared about.
- No SOS shortcut on the dashboard itself (the screen exists app-wide, just not surfaced here).
- No "latest mood" or "latest journal entry" preview widget — only the done/not-done quick-action
  tiles, not the content itself.
- No recommendation engine of any kind.
- Greeting is generic time-of-day only (`getGreeting()`), not personalized by name or goals.

This changes the actual scope of Phase 1D from "build a dashboard" to "make the existing,
already-functional dashboard aware of the profile data collected in Phase 1C-iii, and add the
handful of widgets that don't exist yet." That's a smaller, lower-risk piece of work than starting
from scratch, and it's the accurate basis for the build order below.

---

## Build order

### 1. Recommendation engine (pure logic, no UI, no backend dependency)
New file: `src/utils/recommendations.ts` (or `src/state/useRecommendations.ts` if it needs to be
reactive to store changes — decide based on whether it's called once per dashboard mount or needs
to re-derive on every goal-toggle).

Input shape, all already available client-side with zero new backend calls:
- `WellnessGoal[]` and `PreferredSupport[]` — from `getWellnessPreferences(token)` (already exists
  in `src/api/profileSetup.ts`, unused by Home today).
- Latest `CheckInResponse` — from `listCheckIns(token, 0, 1)` (already exists in `src/api/checkin.ts`).
- `WellnessStateResponse` — already in `useWellnessStore`, no new call needed.

Output: `{ todaysFocus: string, recommendedAction: {label, screen, params?}, journalPrompt: string, encouragement: string }`, built from the rule table in `PHASE_1D_WIDGET_MAPPING.md`.

This is first because everything downstream (the dashboard copy, the "recommended activity" tile)
depends on its output shape being settled before UI is built around it.

### 2. Dashboard state — `useDashboardStore`, not a Home-scoped hook
New file: `src/state/useDashboardStore.ts`, matching the existing `useWellnessStore`/
`useGamificationStore` pattern rather than a screen-local hook. Revised from the original plan
(which scoped this to Home only) — this data has a real lifespan beyond one screen: notifications,
widgets, an AI coach entry point, and counselor/peer-mentor recommendations will all eventually
want "what's this student's latest mood/goal/recommendation" without re-fetching it. A store ages
better than a hook for that.

State: `latestMood`, `latestJournal`, `preferences` (goals/preferredSupport), `recommendation`,
`loading`, `error`, and a `refresh(token)` action.

`refresh()` calls, in parallel via `Promise.allSettled` (per the audit's explicit note: one
failing call should not blank the whole dashboard):
- `getWellnessPreferences(token)` — new consumer of an existing function.
- `listCheckIns(token, 0, 1)` — new consumer of an existing function.
- `listJournalEntries(token, 0, 1)` — new consumer of an existing function.

Once those resolve, `refresh()` feeds the results into the recommendation engine (step 1) and
stores the output as `recommendation`.

`useWellnessStore` and `useGamificationStore` stay exactly as they are — no changes needed there.
`HomeScreen.tsx` reads all three stores (`useWellnessStore`, `useGamificationStore`,
`useDashboardStore`) side by side; this plan does not merge them into one mega-store, since
streak/XP and achievements already have their own working, tested stores and merging would be
pure churn with no benefit.

### 3. New widgets
- `LatestMoodCard` — shows the emotion/stress/energy from the latest check-in, or an empty state
  ("No check-in yet today") if `listCheckIns` returns zero items. Never a loading spinner that
  hangs — resolve to the empty state on any error too, per the audit's fail-open principle already
  established in `OnboardingScreen.tsx`'s profile-status check.
- `JournalPreviewCard` — latest entry's title/snippet, same empty-state handling.
- `SosShortcut` — a small persistent tile linking to the existing `SOS` route; this is pure
  navigation, no new data.
- `RecommendationCard` — renders the recommendation engine's output.

### 4. Extend, don't rebuild, the existing pieces
- `getGreeting()` in `HomeScreen.tsx` — extend to take the user's name and (optionally) their
  top goal, not replace the function.
- `GoalRow`/daily-goals section — leave as-is; it already does what the "Daily Wellness Journey"
  concept asks for. If a distinct "journey" visual (separate from the goals list) is still wanted
  stylistically, that's a design decision to confirm with you before building a second, parallel
  version of the same data.

### 5. Wire the new widgets into `HomeScreen.tsx`
Insert into the existing scroll layout rather than restructuring the screen — the existing
streak/XP/goals/badges sections stay where they are and keep working exactly as they do today.

### 6. Polish and verification
- `tsc --noEmit` (same standing rule as Phase 1C-iii).
- Manual walkthrough on a real device via Expo Go, same as Phase 1C-iii's verification — this
  sandbox has the same `expo export` time-ceiling limitation noted in that phase, so device
  testing remains the higher-value verification step here too.
- Confirm the "unavailable" fallback actually triggers correctly — kill the backend mid-session
  and confirm the dashboard degrades to empty states instead of crashing or hanging, matching the
  gap-classification decisions in `PHASE_1D_WIDGET_MAPPING.md`.

---

## Dependencies between steps

Step 1 (recommendation engine) has no dependency on anything else and can be built and unit-tested
in isolation first. Step 2 (`useDashboardStore`) depends on nothing but existing API functions. Step 3
(widgets) depends on both 1 and 2 being done, since widgets render their output. Step 4 and 5 can
happen in parallel with 3 once the widget components' prop shapes are settled. Step 6 is last by
definition.

## Identified backend gaps (from the audit) and how this plan handles them

- **No combined dashboard-summary endpoint** — handled by parallel client-side calls in step 2,
  per the "Hide for v1.1" classification in `PHASE_1D_WIDGET_MAPPING.md`. Not a blocker.
- **`/api/insights` depends on an external LLM call** — not used in this plan at all, per the
  agreed no-AI-dependency rule. The recommendation engine in step 1 is the rule-based replacement.

No backend code changes are required for Phase 1D as scoped. Every widget in
`PHASE_1D_WIDGET_MAPPING.md` maps to an endpoint that already exists and is already gateway-routed.
