-- Feature 10 (Emergency Contacts): fully greenfield - no monolith equivalent, no pre-existing
-- frontend stub. Owned by auth-service, same "per-user side-table keyed by user_id, no JPA
-- relationship" pattern as push_tokens (see V6__add_push_tokens.sql).
--
-- The partial unique index enforces "at most one primary contact per user" at the database level
-- (defense in depth alongside EmergencyContactService's own unset-then-set logic) - Postgres
-- checks a non-deferred unique index immediately after each statement, so as long as the service
-- unsets the old primary before setting the new one (which it does, in that order, within the
-- same transaction), this never trips even when swapping which contact is primary.

CREATE TABLE emergency_contacts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    relationship    VARCHAR(100),
    notes           VARCHAR(500),
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_contacts_user ON emergency_contacts (user_id, created_at ASC);
CREATE UNIQUE INDEX idx_emergency_contacts_one_primary_per_user ON emergency_contacts (user_id) WHERE is_primary = true;
