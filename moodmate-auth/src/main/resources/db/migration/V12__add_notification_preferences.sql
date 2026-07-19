-- Phase 1E, Step 1: notification preferences. Per-type reminder toggles + quiet hours, backend-
-- synced (unlike the existing local-only daily/inactivity reminder in
-- src/utils/notifications.ts + useGamificationStore.ts on the frontend, which this does not
-- replace yet - see MASTER_IMPLEMENTATION_TRACKER.md's Phase 1E section). Kept in moodmate-auth
-- alongside student_profiles/wellness_preferences since it's the same "per-user settings" domain,
-- not a new microservice - Step 2's notification MODEL (the actual notification rows/inbox) is a
-- different concern and may warrant its own service later; preferences alone don't.
--
-- Unlike wellness_preferences, there is no "onboarding completion" concept here - every field has
-- a sensible default (all reminder types on, no quiet hours) and the row is created lazily on
-- first GET/PUT rather than requiring an explicit complete()/skip() action.
CREATE TABLE notification_preferences (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    mood_reminders          BOOLEAN NOT NULL DEFAULT TRUE,
    journal_reminders       BOOLEAN NOT NULL DEFAULT TRUE,
    habit_reminders         BOOLEAN NOT NULL DEFAULT TRUE,
    sleep_reminders         BOOLEAN NOT NULL DEFAULT TRUE,
    appointment_reminders   BOOLEAN NOT NULL DEFAULT TRUE,
    -- Nullable: no quiet hours configured means reminders can fire any time of day. Stored as
    -- TIME (not TIMESTAMP) since quiet hours are a daily-recurring window, not a specific date.
    quiet_hours_start       TIME,
    quiet_hours_end         TIME,
    -- Optimistic locking, same reasoning/pattern as student_profiles.version and
    -- wellness_preferences.version - this row can plausibly be edited from two device sessions.
    version                 BIGINT NOT NULL DEFAULT 0,
    created_at              TIMESTAMP NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP NOT NULL DEFAULT now()
);

-- user_id's UNIQUE constraint already gives an implicit index for the findByUserId() lookup used
-- on every GET/PUT - same verified reasoning as V10/V11, no extra CREATE INDEX needed.
