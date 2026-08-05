-- Journal service schema: journal entries and the gratitude jar. user_id references
-- auth-service's users.id BY VALUE, not a FOREIGN KEY - see moodmate-auth's V4 migration comment.

CREATE TABLE journal_entries (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(255),
    body        TEXT NOT NULL,
    mood_emoji  VARCHAR(10),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_entries_user_created ON journal_entries (user_id, created_at);

CREATE TABLE gratitude_entries (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_gratitude_entries_user_created ON gratitude_entries (user_id, created_at);
