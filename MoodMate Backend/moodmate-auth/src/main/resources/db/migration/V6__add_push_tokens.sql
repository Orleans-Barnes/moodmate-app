-- Backs PUT/DELETE /api/push/token. `token` (the Expo push token) is UNIQUE, not (user_id,
-- token), because a token identifies one physical device/app install - if a different account
-- logs in on the same device, PushTokenService re-registers the SAME row onto the new user_id
-- rather than accumulating stale rows for old accounts on that device.
CREATE TABLE push_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
