# Phase 1D Dashboard Data Contract

Reference document for Phase 1E (notifications) and beyond: every dashboard widget's data
source, fallback behavior, and refresh trigger in one place, plus the recommendation engine's
rule hierarchy — so a notification, a counsellor-suggestion feature, or anything else that wants
to reuse "what should we tell this student right now" reads the same rules instead of drifting
into a second, slightly-different implementation.

This document describes what the code in `src/state/useDashboardStore.ts`,
`src/utils/recommendationEngine.ts`, and `src/components/dashboard/*` actually does as of Phase
1D. If the code changes, this file needs to change with it — it is not aspirational.

---

## Widgets → data source → fallback

| Widget | Data source | Refresh trigger | Fallback when unavailable |
|---|---|---|---|
| `RecommendationCard` | `useDashboardStore().recommendation` (computed, not fetched directly) | Every `dashboardStore.refresh()` call | Falls back to the neutral default recommendation (`CHECK_IN`) if `latestMood`/`preferences` are both unavailable — never renders empty, always has *some* recommendation. |
| `LatestMoodCard` | `GET /api/checkins?page=0&size=1` via `listCheckIns` | Every `refresh()` | Renders "No check-in yet today" empty state if `latestMood` is `null` or its `createdAt` isn't today — same empty state whether the reason is "genuinely no check-in" or "the mood service didn't respond," which is intentional (see "Known trade-off" below). |
| `JournalPreviewCard` | `GET /api/journal?page=0&size=1` via `listJournalEntries` | Every `refresh()` | Renders "No journal entries yet" empty state if `latestJournal` is `null`, same dual-cause caveat as above. |
| `SosShortcut` | None — pure navigation to the existing `SOS` route | N/A, always rendered | Never gated on any store/auth/loading state by design (see `SosShortcut.tsx`'s own doc comment and `CLAUDE.md`'s "SOS must always stay free" rule). |
| Streak / XP / tree stage stat pills | `GET /api/wellness/state` via `useWellnessStore` (separate, pre-existing store, unchanged by Phase 1D) | Same `useFocusEffect`-driven `refresh()` in `HomeScreen.tsx`, calling `useWellnessStore.load()` | Pre-existing behavior, not touched this phase. |
| Daily goals checklist (`GoalRow`) | `GET /api/wellness/state.todaysGoals[]` via `useWellnessStore` | Same as above | Pre-existing behavior, not touched this phase. |
| Achievements/badges | `GET /api/gamification/achievements/mine` via `useGamificationStore` | Pre-existing store's own trigger, not touched this phase | Pre-existing behavior. |

## Refresh triggers (single entry point)

`useDashboardStore.refresh(token, wellnessState?)` is called from exactly one place today:
`HomeScreen.tsx`'s existing `refresh` callback, itself driven by `useFocusEffect`. That callback
already fires on:
- Initial mount.
- Every time Home regains focus — which covers returning from `CheckIn`, `Journal`,
  `BreathingSession`, etc., since those are pushed on top of the tab navigator and popping back
  refocuses Home automatically.

No pull-to-refresh gesture or app-foreground listener exists yet for this specific store (the
screen has no `RefreshControl` wired up as of this phase) — `useFocusEffect` covers the practical
cases (returning from an action) but not "user pulls down to force-refresh while already looking
at Home" or "app comes back from background without a navigation event." Worth a small follow-up
if either becomes a real gap in practice, not assumed to be one.

## Fallback / partial-failure behavior

`refresh()` fetches `listCheckIns`, `listJournalEntries`, and `getWellnessPreferences` in
parallel via `Promise.allSettled`. Each of the three resulting store fields
(`latestMood`/`latestJournal`/`preferences`) is updated **independently**: a fulfilled promise
overwrites that field, a rejected one leaves whatever was there before untouched. The store-level
`error` field is only set when **all three** calls fail in the same refresh — a partial failure
(e.g. journal down, the other two fine) leaves `error` as `null` and the dashboard shows a mix of
fresh and previously-cached data with no visible distinction between the two.

**Known trade-off, not a bug:** this means a genuinely stale "latest mood" (say, from an hour
before the mood service went down) and a truly-empty "no check-in yet" state render identically
to the user, and a 2-out-of-3-services-down refresh produces no visible warning at all. This was
a deliberate choice for Phase 1D (never show a broken/blank dashboard over showing slightly stale
data), not an oversight. A richer per-widget health signal
(`{mood: 'STALE'|'AVAILABLE'|'ERROR', ...}` instead of a single boolean `error`) is a reasonable
production hardening step, but is explicitly **not** a Phase 1D blocker — noted here so it isn't
forgotten, not because it needs doing now.

## `wellnessState` — accepted, not yet consulted

`RecommendationInput.wellnessState` (`{streakCount, allGoalsDoneToday}`) is threaded all the way
from `HomeScreen.tsx` through `useDashboardStore.refresh()` into `recommendationEngine()`, but no
rule in the engine currently reads it. This is intentional groundwork, not dead code by accident:
kept in place (rather than removed) specifically so a future rule — e.g. "streak >= 7 and all of
today's goals already done → suggest something the student hasn't tried yet, like a gratitude
reflection, instead of repeating a goal-based nudge" — can be added without a signature change or
a second refactor. Any contributor adding such a rule should update this document's "Rule
hierarchy" section below at the same time.

## Recommendation engine — rule hierarchy

From `recommendationEngine.ts`, in priority order (first match wins):

1. **No check-in yet today** (`latestMood` is `null`, or its `createdAt` isn't today) → the
   neutral `CHECK_IN` default. Everything else depends on knowing the student's current mood, so
   this is checked first, unconditionally.
2. **High stress (`stressLevel >= 4` out of 5) or a distressed emotion**
   (`ANXIOUS`/`STRESSED`/`OVERWHELMED`/`FRUSTRATED`/`LONELY`) → a calming `BREATHING`
   recommendation, **overriding any selected wellness goal**. This is one combined rule in the
   code today (a single `if` checking both conditions), not two separate "crisis" and
   "high-stress" branches — worth knowing if a future change wants to route acute distress
   somewhere more targeted than a breathing exercise (e.g. toward `SOS`/crisis resources
   specifically), since that would mean actually splitting this branch, not just relabeling it.
3. **Goal-based recommendation** — one fixed default action per `WellnessGoal` (see the table in
   `PHASE_1D_WIDGET_MAPPING.md`), evaluated only once rules 1–2 don't apply.
4. **`preferredSupport` tie-breaking** — when multiple goals are selected, the first goal whose
   default action matches one of the student's stated `preferredSupport` values wins over plain
   array order; if none match, the first selected goal's action wins.
5. **Default/neutral recommendation** — no goals selected at all (skipped onboarding, or a guest)
   and rules 1–2 didn't apply.

This hierarchy is pinned by the "priority ordering" test group in
`src/utils/__tests__/recommendationEngine.test.ts` — any change to this order should update both
that test group and this document together.

## Reuse contract for Phase 1E (notifications) and beyond

Anything that wants to tell a student "you should probably do X right now" — a scheduled
notification, a counsellor-facing suggestion, a peer-mentor matching hint — should call
`recommendationEngine()` with the same `RecommendationInput` shape rather than re-implementing
goal/mood/stress logic separately. The engine has zero React/Zustand/navigation/network
dependencies specifically so it can be called from a notification scheduler or a server-side
context without dragging in unrelated code. If a notification needs different *wording* than the
dashboard card for the same underlying decision, that's an AI-wording layer on top of this
engine's output (Phase 2's stated direction), not a second decision-making implementation.
