-- Phase 1C-i: personalization, kept separate from student_profiles (V10) - academic identity
-- rarely changes; goals/challenges/support preference can change every semester.
--
-- completed_at / skipped_at / last_prompted_at exist because existsByUserId() alone can't tell
-- "user finished the flow" apart from "user saved one field and left" - a real bug the original
-- proposal had. completed_at IS NOT NULL is the only source of truth for "onboarding done".
-- skipped_at + last_prompted_at together drive the 7-day skip-reminder cooldown without nagging
-- the user every single app open.

-- version added during Phase 1C-i.6 review, before this migration was ever applied - edited in
-- place rather than a new migration, same reasoning as V10.
CREATE TABLE wellness_preferences (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    completed_at        TIMESTAMP,
    skipped_at          TIMESTAMP,
    last_prompted_at    TIMESTAMP,
    -- Optimistic locking (Phase 1C-i.6) - see WellnessPreference.java's @Version field. Same
    -- protection as student_profiles.version.
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- Side tables, matching moodmate-journal's journal_entry_tags (@ElementCollection) pattern -
-- stays queryable/indexable per-value for future features (e.g. "find students whose goal
-- includes STRESS" for peer-mentor matching), unlike a single array/CSV column.

CREATE TABLE wellness_preference_goals (
    preference_id   BIGINT NOT NULL REFERENCES wellness_preferences (id) ON DELETE CASCADE,
    goal            VARCHAR(30) NOT NULL,
    PRIMARY KEY (preference_id, goal)
);

CREATE TABLE wellness_preference_challenges (
    preference_id   BIGINT NOT NULL REFERENCES wellness_preferences (id) ON DELETE CASCADE,
    challenge       VARCHAR(30) NOT NULL,
    PRIMARY KEY (preference_id, challenge)
);

CREATE TABLE wellness_preference_support_types (
    preference_id   BIGINT NOT NULL REFERENCES wellness_preferences (id) ON DELETE CASCADE,
    -- Column name kept as support_type for a stable schema name even though the Java-level
    -- concept is called PreferredSupport (Change 7) - only the enum type name changed, not the
    -- storage shape.
    support_type    VARCHAR(30) NOT NULL,
    PRIMARY KEY (preference_id, support_type)
);

CREATE INDEX idx_wellness_preference_goals_goal ON wellness_preference_goals (goal);

-- Verified: wellness_preferences.user_id's UNIQUE constraint gives it an implicit index (same
-- guarantee as V10). Each side table's composite PRIMARY KEY (preference_id, <value>) also gives
-- an implicit index with preference_id as its leading column, so "all goals for this preference
-- row" lookups (used by WellnessPreferenceMapper on every GET) are already covered without an
-- extra CREATE INDEX.
