-- Add separate chat usage counter to the existing daily usage table
ALTER TABLE ai_daily_usage
    ADD COLUMN IF NOT EXISTS chat_call_count INTEGER NOT NULL DEFAULT 0;

-- Full conversation history per user
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    role         VARCHAR(20)  NOT NULL,
    content      TEXT         NOT NULL,
    message_type VARCHAR(20)  NOT NULL DEFAULT 'text',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_role         CHECK (role         IN ('user', 'assistant')),
    CONSTRAINT chk_message_type CHECK (message_type IN ('text', 'audio', 'image'))
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_created
    ON ai_chat_messages (user_id, created_at DESC);
