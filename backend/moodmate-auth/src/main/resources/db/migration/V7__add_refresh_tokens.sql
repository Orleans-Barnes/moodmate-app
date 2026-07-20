-- JWT Refresh Tokens (Feature 4). Only the SHA-256 hash of the opaque refresh token is stored,
-- never the raw value - identical philosophy to password_reset_tokens' otp_hash. A UNIQUE
-- constraint on token_hash both prevents collisions and gives the lookup-by-hash query its index
-- for free.

CREATE TABLE refresh_tokens (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    token_hash          VARCHAR(64) NOT NULL UNIQUE,   -- hex-encoded SHA-256, always 64 chars
    expires_at          TIMESTAMP NOT NULL,
    revoked             BOOLEAN NOT NULL DEFAULT FALSE,
    -- Set when this token is rotated out (see AuthService.refresh()). If a client ever presents
    -- an already-revoked token again, that's a signal of token theft/replay - every other token
    -- for the same user is revoked in response (see AuthService.refresh()'s reuse-detection path).
    replaced_by_hash    VARCHAR(64),
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
