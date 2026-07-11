-- V15: Counsellor email whitelist
-- Emails pre-approved by admin to hold the COUNSELLOR role.
-- Login gate: whitelisted email → auto-promoted to COUNSELLOR on first login.
-- Does NOT gate signup — all signups create STUDENT accounts.
-- Managed by admin via GET/POST/DELETE /api/admin/whitelist

CREATE TABLE IF NOT EXISTS counsellor_whitelist (
    id         BIGSERIAL    PRIMARY KEY,
    -- Stored as lowercase; application normalises before insert and lookup.
    email      VARCHAR(255) NOT NULL,
    notes      VARCHAR(500),
    added_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_counsellor_whitelist_email UNIQUE (email)
);
