-- V13: streak shield
-- Adds a boolean flag that, when true, absorbs the next streak-break instead of resetting.
-- The shield is purchased by spending 10 leaves via POST /api/wellness/streak/shield.

ALTER TABLE wellness_profiles
    ADD COLUMN IF NOT EXISTS streak_shield_active BOOLEAN NOT NULL DEFAULT FALSE;
