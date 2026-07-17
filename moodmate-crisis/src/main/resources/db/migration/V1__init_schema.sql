-- Crisis service schema: one table, crisis_alerts. Created internally (POST /internal/crisis/alerts)
-- by moodmate-ai (AI chat crisis-keyword detection) and moodmate-journal (journal-entry
-- crisis-keyword detection) - see each service's own migration/client code for the calling side.
-- Never created directly by an end user; only read/actioned by counsellors and admins via
-- /api/crisis/**.
CREATE TABLE crisis_alerts (
    id                       BIGSERIAL PRIMARY KEY,
    user_id                  BIGINT NOT NULL,
    trigger_text             TEXT NOT NULL,
    matched_keywords         VARCHAR(500) NOT NULL,
    severity                 VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH')),
    source                   VARCHAR(20) NOT NULL CHECK (source IN ('AI_CHAT', 'JOURNAL')),
    status                   VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                                 CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
    handled_by_counsellor_id BIGINT,
    resolution_notes         TEXT,
    created_at               TIMESTAMP NOT NULL DEFAULT now(),
    acknowledged_at          TIMESTAMP,
    resolved_at              TIMESTAMP
);

CREATE INDEX idx_crisis_alerts_status ON crisis_alerts(status);
CREATE INDEX idx_crisis_alerts_user_id ON crisis_alerts(user_id);
