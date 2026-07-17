-- Admin service schema: just the counsellor whitelist - everything else this service does
-- (health-pulse, analytics, stats) is read-only queries against other services' schemas via
-- JdbcTemplate, not owned data, so it needs no table of its own. See AdminService's class-level
-- doc comment for why the cross-schema reads are a deliberate, scoped exception in this system.

CREATE TABLE counsellor_whitelist (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    notes       VARCHAR(500),
    added_at    TIMESTAMP NOT NULL DEFAULT now()
);
