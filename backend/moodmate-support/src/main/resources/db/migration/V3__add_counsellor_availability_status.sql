-- Phase 1F-A - the counsellor dashboard's Online/Busy/Away toggle was previously local-only React
-- state (reset on reload, never seen by students). This makes it real: persisted here, read back
-- by the student-facing directory (GET /api/support/counsellors).
ALTER TABLE counsellors ADD COLUMN availability_status VARCHAR(20) NOT NULL DEFAULT 'ONLINE';
