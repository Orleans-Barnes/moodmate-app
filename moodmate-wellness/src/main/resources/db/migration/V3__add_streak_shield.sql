-- Backs POST /api/wellness/streak/shield. See WellnessProfile.java's comment on this field for
-- the consumption rule (auto-consumed by GoalEngine.reconcile() the first time it detects a
-- broken streak, instead of letting the streak reset to 0 that one time).
ALTER TABLE wellness_profiles
    ADD COLUMN has_streak_shield BOOLEAN NOT NULL DEFAULT FALSE;
