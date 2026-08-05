CREATE TABLE escalation_cases (
    id              BIGSERIAL PRIMARY KEY,
    mentor_user_id  BIGINT NOT NULL,          -- the MENTOR who escalated (X-User-Id)
    mentor_name     VARCHAR(255) NOT NULL,     -- denormalised for display
    student_name    VARCHAR(255) NOT NULL,
    concern         TEXT NOT NULL,
    urgency         VARCHAR(20) NOT NULL DEFAULT 'PRIORITY',
    status          VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    feedback        TEXT,
    reviewer_name   VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    reviewed_at     TIMESTAMP,
    CONSTRAINT chk_escalation_urgency CHECK (urgency IN ('ROUTINE','PRIORITY','URGENT')),
    CONSTRAINT chk_escalation_status  CHECK (status IN ('SUBMITTED','IN_REVIEW','FEEDBACK_READY'))
);
CREATE INDEX idx_escalation_mentor  ON escalation_cases (mentor_user_id);
CREATE INDEX idx_escalation_status  ON escalation_cases (status);
