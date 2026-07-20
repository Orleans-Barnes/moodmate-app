-- Feature 14 (Shop Improvements). Backs POST /api/wellness/boosts/double-xp. See
-- WellnessProfile.java's comment on this field for why no "consumed" flag is needed (purely
-- time-based, naturally stops applying once GoalEngine.applyToggle() sees `now` has passed it).
--
-- Feature 18 (End-to-End Verification) - renamed from V4 to V6. It was originally added as
-- V4__add_double_xp_boost.sql, which collided with the pre-existing V4__add_habits.sql (Feature 1,
-- Habit Management) - two migrations can never share a version number, so Flyway would refuse to
-- start this service at all ("Found more than one migration with version 4"). Renumbered past
-- V5__add_sleep.sql (Feature 2) since Feature 14 was built chronologically after both.
ALTER TABLE wellness_profiles
    ADD COLUMN double_xp_active_until TIMESTAMP;
