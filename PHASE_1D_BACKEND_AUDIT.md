# Phase 1D Backend Capability Audit

Read-only investigation, no code changes. Goal: know exactly what Phase 1D's dashboard can build
against today, without guessing at DTOs or assuming an endpoint exists because it "should." Every
line below was confirmed by reading the actual controller/DTO/gateway-route source in this repo,
not inferred from naming.

---

## moodmate-mood (port 8092)

| Endpoint | Method | Auth | Request | Response | Notes |
|---|---|---|---|---|---|
| `/api/checkins` | POST | `X-User-Id` (gateway JWT) | `CheckInRequest{emotionKey, stressLevel, energyLevel, note}` | `CheckInResponse{id, emotionKey, stressLevel, energyLevel, note, createdAt}` | Records a check-in. |
| `/api/checkins` | GET | `X-User-Id` | `page,size` | `Page<CheckInResponse>` | **Ordered `createdAt DESC`** — `?page=0&size=1` gives the latest mood directly. |
| `/api/checkins/count` | GET | `X-User-Id` | — | `{total: long}` | Total check-ins ever, not a streak. |
| `/api/checkins/analytics/trend/weekly` | GET | `X-User-Id` | — | `MoodTrendResponse` | Feature 8, real. |
| `/api/checkins/analytics/emotion-frequency` | GET | `X-User-Id` | `days` | `EmotionFrequencyResponse` | Real. |
| `/api/checkins/trend` | GET | `X-User-Id` | `days` | `MoodHistoryResponse{points:[{emotionKey,stressLevel,energyLevel,date}]}` | Pre-existing, real. |

**Gateway route:** `mood-service` → `localhost:8092`, `Path=/api/checkins/**,/api/mood/**`, `JwtAuthFilter`. Confirmed in `moodmate-gateway/application.yml`.

**Production-ready:** Yes, all DB-backed, no mocks, no placeholders.

**Streak/count caveat:** This service knows *how many* check-ins exist and their history, but does **not** compute a "days-in-a-row" streak — that concept lives in `moodmate-wellness` (see below), tied to daily-goal completion, not check-ins specifically.

---

## moodmate-journal (port 8097)

| Endpoint | Method | Auth | Response | Notes |
|---|---|---|---|---|
| `/api/journal` | GET | `X-User-Id` | `Page<JournalEntryResponse>` | **Ordered `createdAt DESC`** — `?page=0&size=1` gives the latest entry. |
| `/api/journal/{id}` | GET | `X-User-Id` | `JournalEntryResponse{id,title,body,moodEmoji,favorite,tags,createdAt,updatedAt}` | |
| `/api/journal/count` | GET | `X-User-Id` | `long` | Total entry count. |
| `/api/journal/search` | GET | `X-User-Id` | `Page<JournalEntryResponse>` | Feature 12: q/date/emotion/favorite/tag filters, all optional. |
| `/api/journal/tags` | GET | `X-User-Id` | `List<String>` | Distinct tags used. |
| `/api/gratitude` | (Gratitude*) | `X-User-Id` | — | Separate `GratitudeController`, not audited in depth — not needed for Phase 1D's proposed widgets. |

**Gateway route:** `journal-service` → `localhost:8097`, `Path=/api/journal/**,/api/gratitude/**`, `JwtAuthFilter`.

**Production-ready:** Yes, real DB-backed entries, no mocks.

---

## moodmate-gamification (port 8098)

| Endpoint | Method | Auth | Response | Notes |
|---|---|---|---|---|
| `/api/gamification/achievements` | GET | none (public list) | `List<Achievement>` | Catalogue of all achievements. |
| `/api/gamification/achievements/mine` | GET | `X-User-Id` | `List<UserAchievement>` | Which ones this user has unlocked. |
| `/api/gamification/achievements/unlock` | POST | `X-User-Id` | `UserAchievement` | |
| `/api/gamification/missions` | GET | none | `List<Mission>` | Active missions (not expired). |
| `/api/gamification/missions/progress` | GET | `X-User-Id` | `List<UserMissionProgress>` | |
| `/api/gamification/missions/progress` | POST | `X-User-Id` | `UserMissionProgress` | Increment progress toward a mission. |

**Gateway route:** `gamification-service` → `localhost:8098`, `Path=/api/gamification/**`, `JwtAuthFilter`.

**Production-ready:** Yes — `GamificationService` reads/writes real repositories (`AchievementRepository`, `UserMissionProgressRepository`, etc.), no hardcoded/mock data anywhere in the service layer. Confirmed by reading `GamificationService.java` directly.

**Important correction to the initial assumption:** treeXP/leaf-balance/streak-count/daily-goals do **not** live here — they live in `moodmate-wellness`. This service owns only achievements and missions, which are a separate, additive system layered on top.

---

## moodmate-wellness (port 8095)

This is where the dashboard's core "streak" and "today's progress" data actually lives.

| Endpoint | Method | Auth | Response | Notes |
|---|---|---|---|---|
| `/api/wellness/state` | GET | `X-User-Id` | `WellnessStateResponse{treeXp, treeXpMax, treeStage, treeSkinEmoji, leafBalance, streakCount, lastAllGoalsCompletedDate, todaysGoals:[{templateId,key,label,xp,done}], hasStreakShield, doubleXpActiveUntil}` | **Single call gives everything needed for a streak widget and a daily-goals checklist.** |
| `/api/wellness/goals/{key}/toggle` | POST | `X-User-Id` | `ToggleGoalResponse{state, streakIncrementedThisToggle}` | Marks a daily goal done/undone; streak increments only once all 3 are done same day (verified logic, see `useAppState.ts` note from earlier phase). |
| `/api/wellness/streak/shield` | POST | `X-User-Id` | `WellnessStateResponse` | Purchases a streak shield with leaves. |
| `/api/hub/articles` | GET | public | `Page<ArticleResponse>` | Wellness content library. |
| `/api/hub/events` | GET | `X-User-Id` | `Page<EventResponse>` | Campus/wellness events. |
| `/api/habits` | GET/POST/PUT/DELETE + `/toggle`, `/history`, `/stats` | `X-User-Id` | `HabitResponse`, `HabitStatsResponse` | Full habit tracker, real DB-backed. |
| `/api/sleep` | GET/POST/PUT/DELETE + `/analytics/weekly`, `/analytics/monthly`, `/goal` | `X-User-Id` | `SleepLogResponse`, `SleepAnalyticsResponse`, `SleepGoalResponse` | Full sleep tracker, real DB-backed. |

**Gateway route:** `wellness-service` → `localhost:8095`, `Path=/api/wellness/**,/api/hub/**,/api/habits/**,/api/sleep/**`, `JwtAuthFilter`.

**Production-ready:** Yes, entirely.

**No dedicated "breathing exercise" or "recommendation" endpoint exists here or anywhere else** — breathing sessions are and should remain client-side content (`BreathingSessionScreen` already exists in the frontend), and recommendations are exactly the kind of thing the client-side rule engine should own per the agreed Phase 1D scope.

---

## moodmate-ai (port 8101) — future-integration reference only, not a Phase 1D dependency

| Endpoint | Method | Notes |
|---|---|---|
| `/api/ai/chat` | POST | Groq/Gemini-backed chat, requires `GROQ_API_KEY`/model config. |
| `/api/insights` | GET | `InsightsResponse` — an LLM-generated narrative summary. Exists (Feature-23 from earlier phase) but depends on an external LLM call succeeding; not something a rule-based v1.1 dashboard should sit behind. |

**Per the agreed scope: not used in Phase 1D.** Documented here only so Phase 2 (when AI-generated insights get folded into the dashboard) knows exactly what's already there.

---

## Auth requirement summary

Every endpoint above that isn't explicitly marked "public" requires a valid JWT — the gateway's
`JwtAuthFilter` verifies it and injects `X-User-Id` (and `X-User-Role` where relevant) before
forwarding. No service trusts a client-supplied user ID directly; this was already verified as
part of the Phase 1C-i.6 hardening pass. Nothing new needed here for Phase 1D.

## Bottom line

Every widget the revised Phase 1D scope calls for (mood streak, latest mood, journal shortcut,
wellness recommendation source data, daily-goals progress) has a real, gateway-routed, DB-backed
endpoint today. The one piece that does **not** exist anywhere is a single combined "dashboard
summary" endpoint — the frontend will need to call 3–4 endpoints in parallel (`/api/wellness/state`,
`/api/checkins?size=1`, `/api/journal?size=1`) rather than getting one payload. That's a legitimate
gap to weigh in the implementation plan (build it now vs. defer), not a blocker.
