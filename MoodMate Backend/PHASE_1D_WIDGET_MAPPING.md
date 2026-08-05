# Phase 1D Widget Mapping

Every widget in the revised Phase 1D scope, mapped to its real data source. Built directly from
`PHASE_1D_BACKEND_AUDIT.md` — nothing here assumes an endpoint that wasn't confirmed by reading
the actual source.

| Widget | Backend endpoint(s) | Ready? | Notes |
|---|---|---|---|
| Greeting | — (client-side) | ✅ | Uses `user.fullName` (already in `useAuthStore`) + time-of-day. No backend call needed. |
| Today's Focus | Rule engine, fed by `GET /api/users/me/wellness-preferences` (goals/preferredSupport) | ✅ | Client-side logic from Phase 1C-iii's saved profile data. |
| Mood streak | `GET /api/wellness/state` → `streakCount`, `treeStage`, `treeXp` | ✅ | Single call, already gateway-routed, real. |
| Latest mood | `GET /api/checkins?page=0&size=1` → first item of `Page<CheckInResponse>` | ✅ | Ordered `createdAt DESC`, confirmed in `MoodService`. |
| Journal shortcut (latest entry preview) | `GET /api/journal?page=0&size=1` → first item of `Page<JournalEntryResponse>` | ✅ | Ordered `createdAt DESC`, confirmed in `JournalService`. |
| SOS shortcut | Existing `SOSScreen` + `/api/sos/**` (public, unauthenticated by design) | ✅ | Already built in a prior phase; Phase 1D just needs a dashboard entry point to the existing screen — no new backend work. |
| Wellness recommendation | Rule engine, fed by goals + `preferredSupport` + latest mood (`emotionKey`, `stressLevel`) | ✅ | Entirely client-side per agreed scope — see recommendation table below. |
| Continue where you left off | `GET /api/wellness/state` (`todaysGoals`, incomplete ones) + `GET /api/habits` (incomplete today) | ✅ | Composable from two already-real endpoints; no new backend needed. |
| Daily Wellness Journey checklist | `GET /api/wellness/state.todaysGoals[]` (`done` per goal) | ✅ | This *is* the checklist data — `key`/`label`/`done` map directly to journey steps. |
| Weekly insights | `GET /api/checkins/analytics/trend/weekly`, `GET /api/checkins/analytics/emotion-frequency` | ✅ | Real endpoints exist (Feature 8), just not wired into a dashboard widget yet. |
| Achievement badge (e.g. "3-day streak") | `GET /api/gamification/achievements/mine` | ✅ | Real, DB-backed — not mock data despite the original template's assumption. Confirmed by reading `GamificationService.java`. |
| AI-generated insight narrative | `GET /api/insights` | ⚠️ | Endpoint exists but depends on an external LLM call (Groq/Gemini) succeeding — explicitly **out of scope for Phase 1D** per the agreed "no AI dependency" rule. Note for Phase 2. |
| Combined single-call dashboard summary | — | ❌ | No such endpoint exists. Frontend must call `/api/wellness/state`, `/api/checkins?size=1`, `/api/journal?size=1` (and optionally `/api/gamification/achievements/mine`) in parallel. |

---

## Gap classification

| Gap | Classification |
|---|---|
| Combined dashboard-summary endpoint | **Hide for v1.1** — call the 3–4 existing endpoints in parallel client-side (`Promise.allSettled`, one failure shouldn't blank the whole dashboard); revisit as a backend enhancement only if the number of round-trips becomes a measured performance problem, not preemptively. |
| AI-generated insight narrative widget | **Replace with rule-based equivalent for v1.1** — the "Today's Focus" / recommendation text already covers this need without the LLM dependency; real AI insights become a Phase 2 addition once `/api/insights` reliability is proven. |
| Breathing-exercise-specific backend content | **Use existing client-side screen** — `BreathingSessionScreen` already exists; the dashboard just needs to deep-link into it, no new endpoint needed. |

No capability required by the agreed Phase 1D scope is fully missing (❌ with no path forward) —
every widget either has a real endpoint today or is explicitly meant to be client-side rule logic
per the scope you set.

---

## Client-side recommendation engine — rule table

Confirmed against the real `WellnessGoal` and `PreferredSupport` enum values from
`src/screens/profileSetup/labels.ts` (Phase 1C-iii), not invented labels:

| Wellness goal | Recommended action |
|---|---|
| `LESS_STRESS` | Breathing session (existing `BreathingSessionScreen`) + journal prompt |
| `BETTER_SLEEP` | Sleep tracker (`/api/sleep`) + wind-down reminder copy |
| `MORE_CONFIDENT` | Gratitude jar (existing `GratitudeJarScreen`) |
| `BETTER_FOCUS` | Habit tracker check-in (`/api/habits`) |
| `BETTER_GRADES` | Study-balance journal prompt (client-side copy only) |
| `TRACK_EMOTIONS` | Mood check-in shortcut (`/api/checkins`) |
| `BUILD_HEALTHY_HABITS` | Habit tracker (`/api/habits`) |
| `CONNECT_WITH_SUPPORT` | Community/counsellor shortcut (existing screens) |
| `MORE_MOTIVATION` | Wellness Tree progress view (`/api/wellness/state`) |

`preferredSupport` (`AI_COACH`, `COUNSELLOR`, `PEER_MENTOR`, `JOURNALING`, `BREATHING`, `COMMUNITY`,
`SELF_GUIDED`) further weights which of the above surfaces first when multiple goals apply —
exact tie-breaking logic belongs in the implementation plan, not this mapping document.
