-- Phase 1H (Admin Portal - System Settings + Audit Logs). Two more tables this service owns
-- outright, same reasoning as counsellor_whitelist in V1: these are admin-portal concerns with no
-- natural home in any other service's schema, not data another service reads/writes for its own
-- purposes.

CREATE TABLE feature_flags (
    id          BIGSERIAL PRIMARY KEY,
    flag_key    VARCHAR(100) NOT NULL UNIQUE,
    enabled     BOOLEAN NOT NULL DEFAULT false,
    description VARCHAR(500),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- adminUserId is a plain column, not a FK to auth.users - same "plain id column, not a JPA
-- relationship across schemas" reasoning as moodmate-support's Appointment.counsellorId. targetId
-- is a string, not a typed FK, since a single audit log spans several different target kinds
-- (user id, counsellor id, report id, article id, ...) with no shared id space.
CREATE TABLE audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    admin_user_id  BIGINT NOT NULL,
    action         VARCHAR(100) NOT NULL,
    target_type    VARCHAR(50) NOT NULL,
    target_id      VARCHAR(100),
    details        VARCHAR(1000),
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
