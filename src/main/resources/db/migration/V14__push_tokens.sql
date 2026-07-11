-- Push tokens for Expo Push Notification Service.
-- One user can have multiple tokens (e.g. different devices).
-- Token is unique globally — if the same device re-registers after logout/login
-- the upsert in PushTokenController just updates the user_id.
CREATE TABLE IF NOT EXISTS push_tokens (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(512) NOT NULL,
    updated_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_push_tokens_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
