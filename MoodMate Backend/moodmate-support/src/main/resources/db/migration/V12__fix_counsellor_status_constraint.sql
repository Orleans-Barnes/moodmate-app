-- Adds SUSPENDED to the counsellors.status CHECK constraint.
-- A different V10 was already applied to the shared support database, so this fix must live in a
-- later migration version to avoid Flyway checksum validation failures on startup.

DO $$
DECLARE
    v_constraint text;
BEGIN
    SELECT conname INTO v_constraint
    FROM   pg_constraint
    WHERE  conrelid = 'counsellors'::regclass
      AND  contype  = 'c'
      AND  pg_get_constraintdef(oid) ILIKE '%status%';

    IF v_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE counsellors DROP CONSTRAINT %I', v_constraint);
    END IF;
END $$;

ALTER TABLE counsellors
    ADD CONSTRAINT chk_counsellors_status
    CHECK (status IN ('PENDING','APPROVED','REJECTED','SUSPENDED'));
