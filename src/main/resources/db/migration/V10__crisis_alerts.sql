-- V10: Crisis alert system
-- Stores flagged messages/journal entries for counsellor review.

CREATE TABLE crisis_alerts (
    id                        BIGSERIAL PRIMARY KEY,
    user_id                   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- What triggered the alert
    trigger_text              TEXT         NOT NULL,   -- the raw text snippet (max 500 chars stored)
    matched_keywords          TEXT         NOT NULL,   -- comma-separated matched phrases
    severity                  VARCHAR(20)  NOT NULL DEFAULT 'HIGH',  -- CRITICAL | HIGH
    source                    VARCHAR(20)  NOT NULL DEFAULT 'AI_CHAT', -- AI_CHAT | JOURNAL

    -- Handling lifecycle
    status                    VARCHAR(20)  NOT NULL DEFAULT 'OPEN',  -- OPEN | ACKNOWLEDGED | RESOLVED
    handled_by_counsellor_id  BIGINT       REFERENCES users(id),
    resolution_notes          TEXT,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    acknowledged_at           TIMESTAMPTZ,
    resolved_at               TIMESTAMPTZ
);

CREATE INDEX idx_crisis_alerts_user_id   ON crisis_alerts(user_id);
CREATE INDEX idx_crisis_alerts_status    ON crisis_alerts(status, created_at DESC);
CREATE INDEX idx_crisis_alerts_open      ON crisis_alerts(status) WHERE status = 'OPEN';
