-- Support service schema: counsellors, peer mentors, appointments, 1:1 messaging, and SOS crisis
-- resources. Trimmed from the monolith's full V1__init_schema.sql to just the tables this service
-- owns. user_id/counsellor_id/peer_mentor_id reference other schemas' rows BY VALUE, not FOREIGN
-- KEYs - counsellor_id/peer_mentor_id point within this same schema so those stay real FKs;
-- user_id points at auth-service's users table, which now lives in a different schema/service,
-- so that one is a plain BIGINT column - see moodmate-auth's V4 migration comment for the same
-- pattern applied there.

CREATE TABLE counsellors (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT,
    name            VARCHAR(255) NOT NULL,
    title           VARCHAR(255),
    bio             TEXT,
    avatar_emoji    VARCHAR(10) NOT NULL DEFAULT '🧑‍⚕️',
    specialties     VARCHAR(500),
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    CONSTRAINT chk_counsellors_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE peer_mentors (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    bio             TEXT,
    avatar_emoji    VARCHAR(10) NOT NULL DEFAULT '🌱',
    focus_area      VARCHAR(255),
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE appointments (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    counsellor_id   BIGINT NOT NULL REFERENCES counsellors(id),
    scheduled_at    TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_user ON appointments (user_id, scheduled_at);
CREATE INDEX idx_appointments_counsellor ON appointments (counsellor_id, scheduled_at);

-- A conversation is between one user and exactly one counsellor OR one peer mentor (never both -
-- enforced in the service layer too, not just here, to keep this portable).
CREATE TABLE conversations (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    counsellor_id   BIGINT REFERENCES counsellors(id),
    peer_mentor_id  BIGINT REFERENCES peer_mentors(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (
        (counsellor_id IS NOT NULL AND peer_mentor_id IS NULL) OR
        (counsellor_id IS NULL AND peer_mentor_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_conversation_user_counsellor ON conversations (user_id, counsellor_id) WHERE counsellor_id IS NOT NULL;
CREATE UNIQUE INDEX uq_conversation_user_mentor ON conversations (user_id, peer_mentor_id) WHERE peer_mentor_id IS NOT NULL;

CREATE TABLE support_messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type     VARCHAR(20) NOT NULL,   -- USER, COUNSELLOR, PEER_MENTOR
    body            TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    read_at         TIMESTAMP
);

CREATE INDEX idx_support_messages_conversation ON support_messages (conversation_id, created_at);

-- ============================================================================
-- SOS / CRISIS RESOURCES  (public, unauthenticated, never paywalled)
-- ============================================================================

CREATE TABLE sos_resources (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(500),
    phone           VARCHAR(50),
    url             VARCHAR(255),
    country         VARCHAR(10) NOT NULL DEFAULT 'GH',
    sort_order      INT NOT NULL DEFAULT 0
);
