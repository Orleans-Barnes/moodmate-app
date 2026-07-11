-- V12: Sleep Tracker
-- Daily sleep log entries.

CREATE TABLE sleep_logs (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date      DATE         NOT NULL,
    bedtime       TIME,                -- when they went to bed
    wake_time     TIME,                -- when they woke up
    duration_mins INTEGER,             -- total sleep in minutes
    quality       SMALLINT     CHECK (quality BETWEEN 1 AND 5),
    notes         TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, log_date)
);

CREATE INDEX idx_sleep_logs_user ON sleep_logs(user_id, log_date DESC);
