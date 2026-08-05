-- Institution Management (Milestone 2, Step 1): replaces the free-text `institution` string as
-- the real link between a user and an Institution row. `institution` itself is NOT dropped or
-- deprecated here - it stays as the human-readable display value (and the only value for users
-- whose text never matched a real institution), institution_id is purely additive.
--
-- No JPA-level foreign key: Institution lives in the `admin` schema (a different microservice's
-- schema, same physical Postgres instance) - this project never puts real FK constraints across
-- service schema boundaries (see AuditLogService's cross-schema JdbcTemplate reads for the same
-- "same database, different service, no FK" pattern). institution_id is a plain nullable BIGINT,
-- validated by the service layer only.
ALTER TABLE users ADD COLUMN institution_id BIGINT;

-- Best-effort backfill for existing accounts: match the free-text institution value to a real
-- Institution row by name or short_name (case-insensitive, trimmed). Deliberately guarded by an
-- existence check on admin.institutions - in a real multi-service deployment there is no
-- guaranteed startup ordering between services, so auth-service's migration can run before
-- admin-service has created its own schema/table yet. If that table doesn't exist when this runs,
-- the backfill silently no-ops (every institution_id stays NULL, same as an unmatched string) -
-- it does NOT fail this migration. Whoever deploys second (or re-runs a manual backfill later)
-- can safely re-run this exact UPDATE by hand once both schemas exist.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'admin' AND table_name = 'institutions'
    ) THEN
        UPDATE users u
        SET institution_id = i.id
        FROM admin.institutions i
        WHERE u.institution_id IS NULL
          AND u.institution IS NOT NULL
          AND (
              lower(trim(u.institution)) = lower(trim(i.name))
              OR lower(trim(u.institution)) = lower(trim(i.short_name))
          );
    END IF;
END $$;
