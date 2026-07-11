-- Tracks per-user daily AI insights calls.
-- Used to enforce the freemium limit (5 calls/day).
-- Premium users (ACTIVE/TRIALING subscription) bypass this table entirely.
CREATE TABLE IF NOT EXISTS ai_daily_usage (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT  NOT NULL,
    usage_date DATE    NOT NULL,
    call_count INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT uq_ai_daily_usage UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_daily_usage_user_date ON ai_daily_usage (user_id, usage_date);
