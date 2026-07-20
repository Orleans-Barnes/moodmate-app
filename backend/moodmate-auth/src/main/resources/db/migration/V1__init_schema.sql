-- Auth service schema: this service owns exactly one table, `users`. Every other domain
-- (gamification, mood, journal, community, support, wellness hub, SOS, payments) that used to
-- live in this same file (copied wholesale from the monolith's schema) has been removed - those
-- tables belong to their own services' own migrations, in their own Postgres schema. Cross-service
-- references to users.id are enforced in application code, not FOREIGN KEYs, since another
-- service's schema can no longer see this one.

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),                 -- null for guest accounts
    full_name       VARCHAR(255) NOT NULL,
    institution     VARCHAR(255),
    avatar_emoji    VARCHAR(10) NOT NULL DEFAULT '🙂',
    is_guest        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);
