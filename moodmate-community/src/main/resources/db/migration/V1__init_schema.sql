-- Community service schema: anonymous posts and per-post reactions. Trimmed from the monolith's
-- full V1__init_schema.sql to just the tables this service owns. author_id/user_id reference
-- auth-service's users table BY VALUE, not a FOREIGN KEY - see moodmate-auth's V4 migration
-- comment for the same pattern applied there.
--
-- is_flagged/flag_reason are additive columns, not in the monolith - back the admin moderation
-- feature kept from the pre-existing service stub (flag/clear-flag/remove a post).

CREATE TABLE community_posts (
    id                  BIGSERIAL PRIMARY KEY,
    author_id           BIGINT NOT NULL,
    anonymous_handle    VARCHAR(50) NOT NULL,   -- e.g. "Anonymous Owl" - generated per post
    topic               VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    content             TEXT NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    is_flagged          BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason         VARCHAR(500)
);

CREATE INDEX idx_community_posts_created ON community_posts (created_at DESC);
CREATE INDEX idx_community_posts_topic_created ON community_posts (topic, created_at DESC);
CREATE INDEX idx_community_posts_flagged ON community_posts (is_flagged);

CREATE TABLE post_reactions (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL,
    reaction_type   VARCHAR(20) NOT NULL DEFAULT 'HEART',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)   -- one reaction per user per post; changing it updates the row
);

CREATE INDEX idx_post_reactions_post ON post_reactions (post_id);
