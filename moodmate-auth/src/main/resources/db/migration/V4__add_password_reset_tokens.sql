-- Backs POST /api/auth/forgot-password and /api/auth/reset-password. One row per OTP issued;
-- old rows for a user are left in place (not deleted) but become unusable once `used` is true or
-- `expires_at` has passed, so history is preserved for debugging without needing a cleanup job.
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash    VARCHAR(255) NOT NULL,   -- BCrypt hash of the 6-digit OTP, same encoder as passwords
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
