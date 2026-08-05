-- AI service schema: one table, ai_chat_messages. No monolith counterpart - see README.md.
CREATE TABLE ai_chat_messages (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    role         VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ASSISTANT')),
    content      TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'AUDIO', 'IMAGE')),
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
