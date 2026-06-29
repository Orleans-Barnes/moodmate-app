-- Links a counsellors row to a real user account and tracks the self-serve request status.
-- Existing seeded rows (V2__seed_reference_data.sql) are already-live roster entries, so they're
-- backfilled to APPROVED. New rows created via the counsellor-request flow default to PENDING
-- until an admin approves them.
ALTER TABLE counsellors
    ADD COLUMN user_id BIGINT REFERENCES users(id),
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

UPDATE counsellors SET status = 'APPROVED';

ALTER TABLE counsellors
    ADD CONSTRAINT chk_counsellors_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
