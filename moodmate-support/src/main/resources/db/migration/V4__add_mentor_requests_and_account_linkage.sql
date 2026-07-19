-- Phase 1G - two additive changes:
-- 1. peer_mentors.user_id - links a roster row to a real account, exactly like
--    counsellors.user_id (V1). Nullable because, same as counsellors, existing seeded rows
--    pre-date account linkage. Set by SupportService.linkMentorAccount (admin-only for now - see
--    that method's doc comment for why this isn't a self-serve request/approve flow yet).
-- 2. mentor_requests - the actual Student -> Request -> Mentor accepts/declines -> Conversation
--    workflow this phase exists to build (previously startConversation's mentor branch created a
--    conversation unconditionally, with no request/accept step at all).
ALTER TABLE peer_mentors ADD COLUMN user_id BIGINT;

CREATE TABLE mentor_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    peer_mentor_id  BIGINT NOT NULL REFERENCES peer_mentors(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    responded_at    TIMESTAMP,
    CONSTRAINT chk_mentor_requests_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED'))
);

-- A student can only have one PENDING request to a given mentor at a time (no spamming) - but can
-- re-request after a DECLINED one, since that isn't in this partial index.
CREATE UNIQUE INDEX uq_mentor_requests_pending ON mentor_requests (user_id, peer_mentor_id) WHERE status = 'PENDING';
CREATE INDEX idx_mentor_requests_mentor ON mentor_requests (peer_mentor_id, status);
CREATE INDEX idx_mentor_requests_user ON mentor_requests (user_id);
