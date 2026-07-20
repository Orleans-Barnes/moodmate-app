-- Sleep tracking - added for the Sleep Tracking feature (production-completion pass). One row
-- per (user, date); POST /api/sleep upserts on that pair, matching SleepTrackerScreen.tsx's own
-- documented contract ("POST /api/sleep upserts on date").

CREATE TABLE sleep_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    log_date        DATE NOT NULL,
    bedtime         VARCHAR(5) NOT NULL,   -- "HH:MM", stored as text like the frontend sends it
    wake_time       VARCHAR(5) NOT NULL,   -- "HH:MM"
    duration_mins   INT NOT NULL,
    quality         INT NOT NULL,          -- 1-5
    notes           VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, log_date)
);

CREATE INDEX idx_sleep_logs_user_date ON sleep_logs (user_id, log_date DESC);

-- One optional target-sleep-duration row per user (Sleep Goals).
CREATE TABLE sleep_goals (
    user_id         BIGINT PRIMARY KEY,
    target_minutes  INT NOT NULL DEFAULT 480,  -- 8h default
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);
