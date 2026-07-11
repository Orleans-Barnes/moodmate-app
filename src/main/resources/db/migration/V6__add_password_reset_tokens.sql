-- One-time password tokens for the forgot-password flow.
-- A row is inserted when the user requests a reset, deleted on use or expiry.
-- expires_at is stored as UTC; the service rejects tokens older than 15 minutes.
CREATE TABLE password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    otp        VARCHAR(6)   NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- We look up by email+otp together, so a composite index speeds that query.
CREATE INDEX idx_prt_email ON password_reset_tokens (email);
