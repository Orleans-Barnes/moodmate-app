-- Phase 1F-B - Video session audit log for compliance and debugging. Records every join attempt
-- (successful or failed), who attempted it, when, and the outcome. Separate from appointments
-- table because one appointment can have multiple join attempts (refresh, reconnect, denied).

CREATE TABLE video_session_audit (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id),
    user_id BIGINT NOT NULL,
    user_role VARCHAR(20) NOT NULL,  -- STUDENT or COUNSELLOR (who attempted the join)
    action VARCHAR(50) NOT NULL,     -- WINDOW_CHECK, JOIN_GRANTED, JOIN_DENIED
    reason VARCHAR(100),              -- NULL for granted, or NOT_CONFIRMED/TOO_EARLY/EXPIRED/UNAUTHORIZED
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for querying audit logs by appointment (compliance review, debugging)
CREATE INDEX idx_video_audit_appointment ON video_session_audit(appointment_id, created_at DESC);

-- Index for querying user activity (analytics, security review)
CREATE INDEX idx_video_audit_user ON video_session_audit(user_id, created_at DESC);