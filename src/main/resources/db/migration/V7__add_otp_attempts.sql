-- Track how many times a wrong OTP was submitted for a reset token.
-- Tokens are locked (rejected without incrementing) after MAX_ATTEMPTS (5).
-- Safe to run on existing data: all current rows default to 0 attempts.
ALTER TABLE password_reset_tokens
    ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
