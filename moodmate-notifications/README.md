# MoodMate — Notifications Service

Single aggregation point for every in-app notification across the system. Owns the `Notification`
entity, inbox, and read/unread lifecycle. Every other service (support, mood, journal, wellness,
gamification, admin, ai) is a "producer": instead of writing into this schema directly, each calls
this service's internal endpoint to record a notification. `moodmate-auth` remains the owner of
per-user notification *preferences* (which reminder types are enabled, quiet hours) — that's a
separate concern from the notifications themselves, which is why it stays in `moodmate-auth`
rather than moving here.

## Public endpoints (`/api/notifications`, port 8102, gateway-routed with `JwtAuthFilter`)

| Method | Path                          | Description                                      |
|--------|-------------------------------|---------------------------------------------------|
| GET    | `/`                            | Paginated list of the calling user's notifications, newest first. |
| GET    | `/unread-count`                | Count of the calling user's unread notifications. |
| PATCH  | `/{id}/read`                   | Mark one notification read (idempotent).          |
| PATCH  | `/read-all`                    | Mark all of the calling user's notifications read. |

All of these trust the `X-User-Id` header the gateway injects from the verified JWT, same pattern
as every other per-user-scoped controller in this system.

## Internal endpoint (`/internal/notifications`, NOT gateway-routed)

| Method | Path   | Description                                                |
|--------|--------|--------------------------------------------------------------|
| POST   | `/`    | Create a notification for a given `userId`. Called directly by other services on port 8102, never through the gateway — same convention as `moodmate-crisis`'s `/internal/crisis/**` and `moodmate-wallet`'s `/internal/wallet/**`. |

`scheduledAt` is optional: omitted/null means "deliver now" (status starts `PENDING`); a future
instant means "not due yet" (status starts `SCHEDULED`). A later scheduling job is responsible for
flipping `SCHEDULED` rows to delivered once due — this endpoint only records intent.

## Data model

- `NotificationType` — MOOD_REMINDER, JOURNAL_REMINDER, HABIT_REMINDER, SLEEP_REMINDER,
  APPOINTMENT_BOOKED/CONFIRMED/CANCELLED/COMPLETED, MENTOR_REQUEST/ACCEPTED/DECLINED,
  CRISIS_ALERT, ARTICLE_PUBLISHED, EVENT_REMINDER, ACHIEVEMENT_UNLOCKED, MISSION_COMPLETED,
  ADMIN_ANNOUNCEMENT, SYSTEM.
- `NotificationStatus` — PENDING, SCHEDULED, DELIVERED, READ, FAILED.
- `Notification` — id, userId, type, title (≤200 chars), body (≤1000 chars), destinationScreen,
  destinationParams (JSON text, for deep-linking), status, scheduledAt, deliveredAt, readAt,
  metadata (JSON text), createdAt.

Owns the `notifications` schema outright (see `src/main/resources/db/migration`). `user_id`
columns reference auth-service's `users` table by value, not a foreign key, since that table lives
in a different service/schema — same convention as `moodmate-gamification`.

## Not yet implemented (future steps)

Expo Push / FCM / email / SMS / WhatsApp delivery channels, the scheduled-reminder job that
promotes `SCHEDULED` → `DELIVERED`, retry queues for failed deliveries, and delivery analytics.
Producer clients in the other services (`NotificationServiceClient`, one per producer) are also
not yet written — see `MASTER_IMPLEMENTATION_TRACKER.md`'s Phase 1E Step 2/3 status.
