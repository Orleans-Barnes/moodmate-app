# First-Time Student Journey — Sequence Diagram

Backend/frontend contract for Phase 1C-iii. Covers the complete first-run experience end to end, plus the alternate flows that must be handled before UI work starts. All endpoint paths and behaviors below match what's actually implemented in `moodmate-auth` as of Phase 1C-i.6 (verified: migrations applied, 56/56 tests passing, app boots against real Postgres) — nothing here is aspirational.

Actors: **App** (React Native client), **Gateway** (`moodmate-gateway`, enforces JWT via `JwtAuthFilter`), **Auth** (`moodmate-auth` — `AuthController` + `profile.controller.*`).

---

## Main flow

```mermaid
sequenceDiagram
    actor U as Student
    participant App
    participant Gateway
    participant Auth as moodmate-auth

    U->>App: Fills signup form
    App->>Gateway: POST /api/auth/signup
    Gateway->>Auth: forward (no JWT required for signup)
    Auth-->>Gateway: 201 {accessToken, refreshToken}
    Gateway-->>App: 201 {accessToken, refreshToken}
    App->>App: Store tokens securely

    App->>Gateway: GET /api/users/me/profile-status (Bearer accessToken)
    Gateway->>Gateway: JwtAuthFilter validates token, injects X-User-Id
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200 {profileCompletion:0, needsAcademicProfile:true, needsGoals:true, canShowOnboarding:true}
    Gateway-->>App: 200 (as above)

    App->>App: Route to onboarding flow (not dashboard)

    Note over App,Auth: Programme screen
    App->>Gateway: PUT /api/users/me/student-profile {"programme":"COMPUTER_SCIENCE"}
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200 {programme, yearOfStudy:null, updatedAt}
    Gateway-->>App: 200

    Note over App,Auth: Year of study screen
    App->>Gateway: PUT /api/users/me/student-profile {"yearOfStudy":"SECOND_YEAR"}
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200 {programme (unchanged), yearOfStudy, updatedAt}
    Gateway-->>App: 200

    Note over App,Auth: Wellness goals screen
    App->>Gateway: PUT /api/users/me/wellness-preferences {"goals":[...]}
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200 {goals, completed:false}
    Gateway-->>App: 200

    Note over App,Auth: Challenges screen (optional, never scored)
    App->>Gateway: PUT /api/users/me/wellness-preferences {"challenges":[...]}
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200 {challenges, goals unchanged}
    Gateway-->>App: 200

    Note over App,Auth: Preferred support screen
    App->>Gateway: PUT /api/users/me/wellness-preferences {"preferredSupport":[...]}
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200 {preferredSupport, goals/challenges unchanged}
    Gateway-->>App: 200

    Note over App,Auth: Onboarding finish screen
    App->>Gateway: POST /api/users/me/wellness-preferences/complete
    Gateway->>Auth: forward + X-User-Id
    Auth->>Auth: Requires >=1 goal already saved, else 400
    Auth-->>Gateway: 200 {completed:true, completedAt}
    Gateway-->>App: 200

    App->>Gateway: GET /api/users/me/profile-status
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200 {profileCompletion:100, needsAcademicProfile:false, needsGoals:false, canShowOnboarding:false}
    Gateway-->>App: 200

    App->>App: Route to Dashboard, personalize using saved goals/preferredSupport
```

**Future launches:** app calls `GET /api/users/me/profile-status` on startup as it always has. Once `canShowOnboarding` is `false` (permanent after `completedAt` is set), the app goes straight to Dashboard — no extra client-side "have I onboarded" flag needed, this is derived server-side every time.

---

## Alternate flow 1 — Skip for now

```mermaid
sequenceDiagram
    actor U as Student
    participant App
    participant Auth as moodmate-auth

    U->>App: Taps "Skip for now" on any onboarding screen
    App->>Auth: POST /api/users/me/wellness-preferences/skip
    Auth-->>App: 200 {skipped:true, skippedAt, lastPromptedAt}
    App->>App: Route to Dashboard (partial data, if any, is preserved)

    Note over App,Auth: Next app launch, within 7 days
    App->>Auth: GET /api/users/me/profile-status
    Auth-->>App: 200 {canShowOnboarding:false}
    App->>App: Go straight to Dashboard, no prompt

    Note over App,Auth: App launch, 7+ days after skip
    App->>Auth: GET /api/users/me/profile-status
    Auth-->>App: 200 {canShowOnboarding:true}
    App->>Auth: POST /api/users/me/wellness-preferences/prompted
    Auth-->>App: 204
    App->>App: Show onboarding prompt again (resumes from wherever partial data left off)
```

The cooldown is computed server-side in `ProfileCompletionService` from `max(skippedAt, lastPromptedAt)` — the app never has to track the 7-day window itself, just call `/prompted` at the moment it actually renders the prompt (not on every poll), so the cooldown stays honest even against repeated dismissals.

---

## Alternate flow 2 — Network failure during a partial save

```mermaid
sequenceDiagram
    actor U as Student
    participant App
    participant Auth as moodmate-auth

    U->>App: Selects programme, taps Next
    App->>Auth: PUT /api/users/me/student-profile {"programme":"LAW"}
    Auth--xApp: Request times out / connection drops
    App->>App: Show inline retry, do NOT advance screen
    U->>App: Taps Retry
    App->>Auth: PUT /api/users/me/student-profile {"programme":"LAW"} (identical retry)
    Auth-->>App: 200 {programme:"LAW", ...}
    App->>App: Advance to next screen
```

This retry is safe by construction: partial-update PUTs are idempotent on identical input (same field, same value → same resulting row), so a blind retry after a timeout never double-applies or corrupts state. This is a direct consequence of the partial-update design principle enforced throughout Phase 1C-i.

---

## Alternate flow 3 — Optimistic-lock conflict (409)

```mermaid
sequenceDiagram
    actor U as Student
    participant AppA as App (device A)
    participant AppB as App (device B / stale tab)
    participant Auth as moodmate-auth

    AppA->>Auth: GET /api/users/me/student-profile (version=3)
    AppB->>Auth: GET /api/users/me/student-profile (version=3)
    AppA->>Auth: PUT student-profile {"yearOfStudy":"THIRD_YEAR"}
    Auth-->>AppA: 200 (version now 4)
    AppB->>Auth: PUT student-profile {"yearOfStudy":"SECOND_YEAR"} (still thinks version=3)
    Auth-->>AppB: 409 {message:"This profile was updated elsewhere since you last loaded it - please refresh and try again"}
    AppB->>Auth: GET /api/users/me/student-profile (re-fetch, gets version=4)
    AppB->>Auth: PUT student-profile {"yearOfStudy":"SECOND_YEAR"} (retried against version=4)
    Auth-->>AppB: 200 (version now 5)
```

In practice this is unlikely for a single-user profile edit, but it protects against a double-tap or a retried network call racing an earlier in-flight write. Client contract on 409: re-`GET`, then retry the write — never silently drop the user's input.

---

## Alternate flow 4 — Access token expires mid-onboarding

```mermaid
sequenceDiagram
    actor U as Student
    participant App
    participant Gateway
    participant Auth as moodmate-auth

    App->>Gateway: PUT /api/users/me/wellness-preferences {...} (Bearer <expired accessToken>)
    Gateway->>Gateway: JwtAuthFilter rejects expired token
    Gateway-->>App: 401 Unauthorized
    App->>Gateway: POST /api/auth/refresh {refreshToken}
    Gateway->>Auth: forward
    Auth-->>Gateway: 200 {accessToken (new), refreshToken}
    Gateway-->>App: 200
    App->>App: Store new tokens
    App->>Gateway: PUT /api/users/me/wellness-preferences {...} (Bearer <new accessToken>)
    Gateway->>Auth: forward + X-User-Id
    Auth-->>Gateway: 200
    Gateway-->>App: 200 (original request now succeeds, transparent to the user)
```

This reuses the Phase 1A refresh-token wiring already built into the frontend (`POST /api/auth/refresh`) — no new token-handling logic is needed for onboarding specifically, it's the same interceptor pattern already applied to every other authenticated call.

---

## What this document is (and isn't)

This is the implementation target for Phase 1C-iii screens — it fixes the exact request/response shapes, the order partial saves happen in, and how each edge case is expected to behave, so UI decisions aren't made ad hoc while coding. It is **not** a visual/UX spec (screen layout, copy, animation) — that's still owned by the design direction already established (Headspace-calm + Duolingo-style feedback) and isn't re-litigated here.
