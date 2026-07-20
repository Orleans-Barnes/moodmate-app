-- Fix #4 (Peer Mentor self-serve application flow) - adds the PENDING/APPROVED/REJECTED status
-- Counsellor already had (see V1's counsellors.status), so a student can apply and an admin can
-- review/approve/reject, same shape as the counsellor request pipeline.
--
-- Existing rows are backfilled to APPROVED (not PENDING) because they're the pre-existing seeded
-- roster (V2) plus any admin-linked rows from Phase 1G - all already live and visible before this
-- migration, so defaulting them to APPROVED preserves current behavior exactly. Only new rows
-- created via the new self-serve application endpoint start at PENDING (the entity's own default).
ALTER TABLE peer_mentors ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';

ALTER TABLE peer_mentors ADD CONSTRAINT chk_peer_mentors_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- New rows going forward (self-serve applications) should default to PENDING at the application
-- layer (PeerMentor.status field default), not the DB default above - the DB default only exists
-- to backfill pre-existing rows correctly in this one migration.
ALTER TABLE peer_mentors ALTER COLUMN status DROP DEFAULT;

CREATE INDEX idx_peer_mentors_status ON peer_mentors (status);
