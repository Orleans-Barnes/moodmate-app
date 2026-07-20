-- User-defined habits (distinct from the templated daily_goal_templates above - habits are
-- created/named/deleted by the user themselves, one row per habit, with their own independent
-- streak). Added for the Habit Management feature (production-completion pass).

CREATE TABLE habits (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    name                VARCHAR(100) NOT NULL,
    icon                VARCHAR(10) NOT NULL DEFAULT '✅',
    color               VARCHAR(20) NOT NULL DEFAULT '#52B788',
    xp_per_completion   INT NOT NULL DEFAULT 10,
    streak_count        INT NOT NULL DEFAULT 0,
    last_completed_date DATE,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_habits_user ON habits (user_id);

CREATE TABLE habit_completions (
    id              BIGSERIAL PRIMARY KEY,
    habit_id        BIGINT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL,
    completion_date DATE NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (habit_id, completion_date)
);

CREATE INDEX idx_habit_completions_habit_date ON habit_completions (habit_id, completion_date);
