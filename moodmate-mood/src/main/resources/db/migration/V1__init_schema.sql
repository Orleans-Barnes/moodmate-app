-- Mood service schema: this service owns exactly one table, `mood_checkins`. user_id references
-- auth-service's users.id BY VALUE, not a FOREIGN KEY - see moodmate-auth's V4 migration comment.

CREATE TABLE mood_checkins (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    emotion_key     VARCHAR(50) NOT NULL,   -- matches frontend EMOTIONS labels, e.g. HAPPY/CALM/ANXIOUS
    stress_level    SMALLINT NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
    energy_level    SMALLINT NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_mood_checkins_user_created ON mood_checkins (user_id, created_at);
