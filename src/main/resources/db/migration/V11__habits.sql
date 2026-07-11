-- V11: Habit Tracker
-- User-defined daily habits with streak tracking.

CREATE TABLE habits (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    icon        VARCHAR(10)  NOT NULL DEFAULT '✅',   -- emoji
    color       VARCHAR(10)  NOT NULL DEFAULT '#5F9E7C',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    archived    BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE habit_completions (
    id          BIGSERIAL   PRIMARY KEY,
    habit_id    BIGINT      NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_on DATE       NOT NULL,
    UNIQUE (habit_id, completed_on)
);

CREATE INDEX idx_habits_user_id        ON habits(user_id) WHERE archived = FALSE;
CREATE INDEX idx_habit_completions_habit ON habit_completions(habit_id, completed_on DESC);
CREATE INDEX idx_habit_completions_user  ON habit_completions(user_id, completed_on DESC);
