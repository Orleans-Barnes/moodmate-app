-- Gamification service schema: achievements, missions, and per-user progress against both. This
-- has no monolith counterpart at all - the monolith never had achievements/missions, only the
-- tree XP/streak system that now lives in moodmate-wellness. Fully self-contained: every table
-- here is owned outright by this service, and user_id is a plain BIGINT (references
-- auth-service's users BY VALUE, not a FOREIGN KEY - same pattern as every other service's
-- cross-schema user_id column).

CREATE TABLE achievements (
    id              BIGSERIAL PRIMARY KEY,
    key             VARCHAR(50) NOT NULL UNIQUE,
    title           VARCHAR(255) NOT NULL,
    description     VARCHAR(500),
    icon_name       VARCHAR(100),
    xp_reward       INT NOT NULL DEFAULT 50,
    leaf_reward     INT NOT NULL DEFAULT 0
);

CREATE TABLE missions (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     VARCHAR(500),
    mission_type    VARCHAR(20) NOT NULL DEFAULT 'DAILY',   -- DAILY, WEEKLY
    target_count    INT NOT NULL DEFAULT 1,
    xp_reward       INT NOT NULL DEFAULT 25,
    leaf_reward     INT NOT NULL DEFAULT 5,
    expires_on      DATE                                    -- null = never expires
);

CREATE TABLE user_achievements (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    achievement_key     VARCHAR(50) NOT NULL REFERENCES achievements(key),
    earned_at           TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, achievement_key)
);

CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);

CREATE TABLE user_mission_progress (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    mission_id      BIGINT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    progress        INT NOT NULL DEFAULT 0,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMP,
    UNIQUE (user_id, mission_id)
);

CREATE INDEX idx_user_mission_progress_user ON user_mission_progress (user_id);
