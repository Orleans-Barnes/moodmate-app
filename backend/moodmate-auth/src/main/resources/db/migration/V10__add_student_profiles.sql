-- Phase 1C-i: academic identity, deliberately separate from wellness_preferences (V11) - see
-- WellnessPreference's doc comment for why. Institution stays on users.institution (V1) -
-- unchanged, not duplicated here. Lazily created: no row exists for a user until they save the
-- profile-completion flow at least once, so this migration inserts nothing for existing users.

-- version/CHECK constraints added during Phase 1C-i.5/1C-i.6 review, before this migration was
-- ever applied to any database (edited in place rather than appended as V12 - safe and preferred
-- here specifically because nothing has run `flyway migrate` against V10 yet; once applied to a
-- real database, this file's checksum is locked and any further change would need a new
-- migration instead).
CREATE TABLE student_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    -- Enum name (e.g. "COMPUTER_SCIENCE"), not a display string - see Programme.java. Frontend
    -- owns display labels/grouping-by-faculty; backend only validates membership in the enum.
    -- Note on the explicit CHECK below: VARCHAR(40) alone already rejects anything longer at
    -- insert/update time - Postgres enforces the declared length regardless. The CHECK is
    -- logically redundant with that, kept only because it was explicitly requested as
    -- self-documentation of the bound (makes the constraint visible in \d+ / information_schema
    -- without having to know VARCHAR semantics). It adds no protection VARCHAR(40) doesn't
    -- already provide.
    programme       VARCHAR(40) CHECK (length(programme) <= 40),
    -- Enum name (e.g. "SECOND_YEAR") - see YearOfStudy.java. Same redundancy note as programme.
    year_of_study   VARCHAR(20) CHECK (length(year_of_study) <= 20),
    -- Optimistic locking (Phase 1C-i.6) - see StudentProfile.java's @Version field. Prevents two
    -- concurrent PUTs to the same profile from silently overwriting each other: the second writer
    -- to commit gets an OptimisticLockingFailureException (mapped to 409 by GlobalExceptionHandler)
    -- instead of quietly clobbering the first writer's change.
    version         BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Verified: PostgreSQL always creates an implicit unique B-tree index to enforce a UNIQUE
-- constraint (this is documented PostgreSQL behavior, not an assumption) - so user_id already
-- has an index backing it. No separate CREATE INDEX is added here; one would just be a dead
-- duplicate of the constraint's own index.
