# Phase 1C-i API Contract — Student Profile & Wellness Preferences

Backend: `moodmate-auth`. All endpoints below already existed as routes at the gateway (`Path=/api/users/**`) before this phase — no gateway changes were needed. All require the same `X-User-Id` header the gateway already injects after JWT validation, identical to the existing `GET/PUT /api/users/me`.

Controllers (split per the reviewed checklist): `StudentProfileController`, `WellnessPreferenceController`, `ProfileStatusController` — all under `com.moodmate.auth.profile.controller`, all mapped to `/api/users`.

---

## 1. Student Profile

### `GET /api/users/me/student-profile`

| | |
|---|---|
| Auth | `X-User-Id` header |
| 200 | Profile exists |
| 404 | No profile row yet for this user (never saved anything) |

**200 response body:**
```json
{
  "programme": "COMPUTER_SCIENCE",
  "yearOfStudy": "SECOND_YEAR",
  "updatedAt": "2026-07-18T10:15:00Z"
}
```
Either field may be `null` if only one has ever been saved (e.g. programme saved, year not yet).

### `PUT /api/users/me/student-profile`

Partial-update / upsert. Creates the row on first call, updates it on subsequent calls. **A `null` field in the request body is left untouched — it does not clear an existing value.** This is what lets the frontend save the Programme screen and Year screen as two independent calls.

**Request body:**
```json
{ "programme": "COMPUTER_SCIENCE", "yearOfStudy": null }
```
(Sending `yearOfStudy: null` here means "don't touch year", not "clear it" — to actually change a field, send its new value; to leave it alone, omit it or send `null`.)

| Status | Condition |
|---|---|
| 200 | Saved (whether newly created or updated) |
| 400 | `programme` or `yearOfStudy` is present but not a valid enum value — body: `{ "message": "Invalid programme: <value>" }` |

**Valid `programme` values:** `COMPUTER_SCIENCE`, `INFORMATION_TECHNOLOGY`, `COMPUTER_ENGINEERING`, `ELECTRICAL_ENGINEERING`, `MECHANICAL_ENGINEERING`, `CIVIL_ENGINEERING`, `BUSINESS_ADMINISTRATION`, `ACCOUNTING`, `MEDICINE`, `NURSING`, `PHARMACY`, `LAW`, `PSYCHOLOGY`, `ECONOMICS`, `AGRICULTURE`, `ARCHITECTURE`, `OTHER`

**Valid `yearOfStudy` values:** `FIRST_YEAR`, `SECOND_YEAR`, `THIRD_YEAR`, `FOURTH_YEAR`, `FIFTH_YEAR`, `POSTGRADUATE`

Display labels and any faculty-based grouping for `programme` are a frontend concern (`src/data/programmes.ts`, not built yet) — the backend only validates membership in this enum.

---

## 2. Wellness Preferences

### `GET /api/users/me/wellness-preferences`

| Status | Condition |
|---|---|
| 200 | Preference row exists |
| 404 | Never saved/completed/skipped anything yet |

**200 response body:**
```json
{
  "goals": ["LESS_STRESS", "BETTER_SLEEP"],
  "challenges": ["ACADEMIC_PRESSURE"],
  "preferredSupport": ["JOURNALING", "BREATHING"],
  "completed": false,
  "skipped": false,
  "completedAt": null,
  "skippedAt": null,
  "updatedAt": "2026-07-18T10:20:00Z"
}
```
`completed`/`skipped` are booleans derived from `completedAt`/`skippedAt` server-side — any completion/skip **logic** on the frontend must branch on these booleans, not re-derive them from the timestamps. `completedAt`/`skippedAt` (added Phase 1C-i.6) are included alongside them purely for **display** ("completed 3 days ago", a skip-reminder countdown) — both are `null` until the corresponding action below has been called.

### `PUT /api/users/me/wellness-preferences`

Partial-update / upsert, same semantics as the student-profile `PUT`: a `null` Set field is left untouched; a non-null Set (even `[]`) replaces that field's entire collection. **Does not set `completed`** — only `POST .../complete` does (see below).

**Request body:**
```json
{ "goals": ["LESS_STRESS", "MORE_CONFIDENT"], "challenges": null, "preferredSupport": null }
```

| Status | Condition |
|---|---|
| 200 | Saved |
| 400 | Any value in `goals`/`challenges`/`preferredSupport` isn't a valid enum member — body: `{ "message": "Invalid goal: <value>" }` (or `challenge`/`preferredSupport`) |
| 400 | A field exceeds its selection cap — see below — body: `{ "message": "At most 5 goals may be selected" }` |
| 409 | This preference row was updated elsewhere since it was last read (optimistic-lock conflict — see **Concurrency** below) |

**Selection caps (Phase 1C-i.6, business rules — enforced in `WellnessPreferenceService`, distinct from the `@Size(max=20)` defensive input-size bound on the request DTO):**

| Field | Max selections |
|---|---|
| `goals` | 5 |
| `challenges` | 3 |
| `preferredSupport` | 3 |

**Valid `goals` values:** `LESS_STRESS`, `BETTER_SLEEP`, `MORE_CONFIDENT`, `BETTER_FOCUS`, `BETTER_GRADES`, `TRACK_EMOTIONS`, `BUILD_HEALTHY_HABITS`, `CONNECT_WITH_SUPPORT`, `MORE_MOTIVATION`

**Valid `challenges` values:** `ACADEMIC_PRESSURE`, `LONELINESS`, `ANXIETY`, `BURNOUT`, `FINANCIAL_STRESS`, `RELATIONSHIPS`, `TIME_MANAGEMENT`, `CAREER_CONCERNS`

**Valid `preferredSupport` values:** `AI_COACH`, `COUNSELLOR`, `PEER_MENTOR`, `JOURNALING`, `BREATHING`, `COMMUNITY`, `SELF_GUIDED`

### `POST /api/users/me/wellness-preferences/complete`

Explicit "user finished the onboarding flow" action. The **only** call that sets `completedAt`. No request body.

| Status | Condition |
|---|---|
| 200 | Same shape as `GET`, with `completed: true` |
| 400 | No `goals` have been saved yet — body: `{ "message": "Select at least one goal before completing" }`. This does **not** contradict onboarding being skippable — a user who doesn't want to engage with goals at all should call `skip()`, not `complete()` with nothing selected. |

Idempotent: calling this twice while already completed leaves the original `completedAt` untouched and simply returns `completed: true` again — a retried/duplicate request never resets or re-triggers "completion."

### `POST /api/users/me/wellness-preferences/skip`

Explicit "user deferred the flow" action. Sets both `skippedAt` and `lastPromptedAt` (skipping only happens after the prompt was shown). No request body.

| Status | Response |
|---|---|
| 200 | Same shape as `GET`, with `skipped: true` |

### `POST /api/users/me/wellness-preferences/prompted`

Call this when the UI actually renders the onboarding prompt — **not** on every `profile-status` poll. Stamps `lastPromptedAt` only. Keeps the 7-day cooldown honest even if the user dismisses the prompt without an explicit skip/complete decision.

| Status | Response |
|---|---|
| 204 | No body |

---

## 3. Metadata (enum discovery)

Added in Phase 1C-i.6. Not required by the mobile app today (it owns its own display-label catalogues), but gives a future admin portal, web dashboard, or any other integration one authoritative source for "what are the valid values" instead of hand-copying enum names out of the Java source. Same `/api/users/**` auth as everything else in this document.

```
GET /api/users/meta/programmes      → ["COMPUTER_SCIENCE", "INFORMATION_TECHNOLOGY", ...]
GET /api/users/meta/year-of-study   → ["FIRST_YEAR", "SECOND_YEAR", ...]
GET /api/users/meta/goals           → ["LESS_STRESS", "BETTER_SLEEP", ...]
GET /api/users/meta/challenges      → ["ACADEMIC_PRESSURE", "LONELINESS", ...]
GET /api/users/meta/support-types   → ["AI_COACH", "COUNSELLOR", ...]
```

Each returns a plain JSON array of the enum's constant names, always 200, never empty. No request body, no query parameters.

---

## 4. Profile Status

### `GET /api/users/me/profile-status`

Assembled by `ProfileCompletionService` — the single place completion logic lives, so future profile pieces (avatar, emergency contacts, peer mentor certification, ...) only require editing this one service.

**200 response body:**
```json
{
  "profileCompletion": 85,
  "needsAcademicProfile": false,
  "needsGoals": true,
  "canShowOnboarding": true
}
```

**`profileCompletion` (0–100), weighted:**

| Piece | Weight |
|---|---|
| `programme` set | 40 |
| `yearOfStudy` set | 30 |
| `goals` non-empty | 15 |
| `preferredSupport` non-empty | 15 |

(`challenges` is intentionally never weighted — it's optional, sensitive, and shouldn't pressure disclosure to raise a completion score.) Computed on every read, not stored — cannot drift out of sync with the underlying data.

**`needsAcademicProfile`**: `true` if either `programme` or `yearOfStudy` is missing.

**`needsGoals`**: `true` until `POST .../wellness-preferences/complete` has been called at least once. A partial save (goals only, no support preference) still leaves this `true`.

**`canShowOnboarding`**: `false` once completed, permanently. Otherwise `true` unless the user skipped or was prompted within the last 7 days (measured from whichever of `skippedAt`/`lastPromptedAt` is more recent) — this is the anti-nagging cooldown.

---

## Error format

All 400/404s use the existing `ApiException` → `GlobalExceptionHandler` shape already used by every other endpoint in this service — no new error envelope introduced:
```json
{
  "timestamp": "2026-07-18T10:15:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid programme: UNDECLARED_MAJOR",
  "path": "/api/users/me/student-profile"
}
```
As of the Phase 1C-i.5 hardening pass, this same envelope also now covers a malformed/unreadable request body (previously fell through to a misleading 500) and Bean Validation failures (`@Size` caps on the new request DTOs) via `MethodArgumentNotValidException`, which `GlobalExceptionHandler` already handled before this phase.

**Why the new DTOs use `@Size` caps, not `@NotNull`/`@NotEmpty`:** every field on `StudentProfileRequest` and `WellnessPreferenceRequest` is intentionally optional (partial-update/upsert semantics — see each DTO's doc comment). A `@NotNull` here would reject the exact "save just the programme field" calls the whole save-after-every-screen design exists to support. `@Size` bounds input length/collection size as a defensive measure without constraining which fields must be present. Business-rule caps (the goals/challenges/preferredSupport selection limits above) are enforced separately, in the service layer, since they're domain rules rather than input-size defenses.

## Concurrency

Both `student_profiles` and `wellness_preferences` carry a `@Version` column (Phase 1C-i.6, optimistic locking). If two `PUT` requests race on the same profile — both read the same version, both try to write — the second one to commit gets a `409 Conflict` (`OptimisticLockingFailureException`, mapped by `GlobalExceptionHandler`) instead of silently overwriting the first writer's change:
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "This profile was updated elsewhere since you last loaded it - please refresh and try again"
}
```
Expected client behavior on 409: re-fetch (`GET`) and retry the write, same as any optimistic-concurrency API. This is unlikely in practice for a single-user profile edit, but protects against duplicate in-flight requests (e.g. a double-tap or a retried network call) landing out of order.

## API version stability

**Enum names are part of this API's contract, not an implementation detail.** `programme`, `yearOfStudy`, `goals`, `challenges`, and `preferredSupport` values (e.g. `COMPUTER_SCIENCE`, `LESS_STRESS`) are sent and stored as the literal enum constant name. Renaming a constant later (e.g. `COMPUTER_ENGINEERING` → `COMPUTER_ENG`) is a breaking change for any already-stored data and any client that sent the old name — treat it the same as removing a field. Adding a new constant is safe and non-breaking. Display labels/wording are a frontend-only concern and may change freely without coordinating with this backend.

## Security

Every endpoint in this document inherits `JwtAuthFilter` at the gateway (`moodmate-gateway/application.yml`, route `Path=/api/users/**` → `filters: [JwtAuthFilter]`) — confirmed by inspection, not assumed. No new gateway route was added for this phase, so no new endpoint is reachable anonymously; an unauthenticated request to any URL in this document is rejected by the gateway before it reaches `moodmate-auth` at all, identical to the existing `GET/PUT /api/users/me`.

## What's explicitly unchanged

`POST /api/auth/signup`, `SignupRequest`, `AuthResponse`, `User.java`, and the gateway route table are untouched by this phase. No new dependency was added (`spring-boot-starter-validation`, used for the `@Size` annotations above, was already a dependency of this service prior to this phase). No migration alters an existing table — `V10`/`V11` only `CREATE TABLE`.

## Example end-to-end sequence

The full first-save flow, in order (matches what `ProfileCompletionServiceTest` exercises at the unit level):

```
1. GET  /api/users/me/profile-status
   → { "profileCompletion": 0, "needsAcademicProfile": true, "needsGoals": true, "canShowOnboarding": true }

2. PUT  /api/users/me/student-profile   { "programme": "COMPUTER_SCIENCE" }
   → { "programme": "COMPUTER_SCIENCE", "yearOfStudy": null, "updatedAt": "..." }

3. PUT  /api/users/me/student-profile   { "yearOfStudy": "SECOND_YEAR" }
   → { "programme": "COMPUTER_SCIENCE", "yearOfStudy": "SECOND_YEAR", "updatedAt": "..." }
   (programme from step 2 is untouched - partial-update)

4. PUT  /api/users/me/wellness-preferences   { "goals": ["LESS_STRESS", "BETTER_SLEEP"] }
   → { "goals": [...], "challenges": [], "preferredSupport": [], "completed": false, ... }

5. PUT  /api/users/me/wellness-preferences   { "preferredSupport": ["JOURNALING"] }
   → goals from step 4 are untouched - partial-update

6. POST /api/users/me/wellness-preferences/complete
   → { ..., "completed": true, "completedAt": "..." }

7. GET  /api/users/me/profile-status
   → { "profileCompletion": 100, "needsAcademicProfile": false, "needsGoals": false, "canShowOnboarding": false }
```

## Deferred, not forgotten

- **OpenAPI/Swagger annotations** — this document is the manual equivalent for now. Adding `springdoc-openapi` would be a new dependency; per this project's own "no new dependency unless there's a measurable benefit the existing stack can't provide" rule, deferred until the API surface is large enough that a generated spec earns its keep.
- **Repository tests (`@DataJpaTest`) and one real end-to-end integration test** — both need an actual database context. `MockMvc` controller tests (`StudentProfileControllerTest`, `WellnessPreferenceControllerTest`) are included in this pass and need no database, since they mock the service layer.
  - **Decision (explicitly made, not defaulted to): no H2.** This project uses PostgreSQL-specific behavior throughout — enums stored as `VARCHAR` via `@Enumerated(EnumType.STRING)`, `@Version` optimistic locking, Flyway migrations, `CHECK` constraints, side-table `@ElementCollection`s. H2's emulation of these can diverge from real Postgres behavior in exactly the ways that matter here, which would produce false-positive green tests rather than genuine coverage.
  - **Planned instead, once CI/CD is introduced: Testcontainers with a real `postgres:17` container.** Migrations run exactly as they do in production via the same Flyway path, and optimistic locking / constraints / indexes are exercised against the real engine, not an approximation. This is deferred, not skipped — it depends on CI/CD infrastructure that doesn't exist yet in this project, not on any remaining code work in `moodmate-auth` itself.
  - Until then, database-backed correctness is verified manually against a local PostgreSQL instance (migration application, endpoint exercising, and the 409 optimistic-lock path specifically, since two genuinely racing transactions can't be simulated with a mocked service layer).
