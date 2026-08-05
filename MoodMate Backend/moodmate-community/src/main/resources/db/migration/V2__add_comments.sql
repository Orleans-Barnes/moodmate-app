-- Feature 6 (Community Comments): threaded comments on community_posts. Not in the monolith -
-- the monolith never had comments, only posts + reactions - so this is a genuinely new table,
-- not a port. Follows the same conventions as V1: author_id references auth-service's users
-- table BY VALUE (no FK), post_id/parent_comment_id use real FKs with ON DELETE CASCADE since
-- both parents live in this same service's schema (same pattern as post_reactions -> community_posts).
--
-- parent_comment_id is nullable and self-referential: NULL means a top-level comment, non-NULL
-- means a reply to another comment. ON DELETE CASCADE on parent_comment_id means deleting a
-- comment also deletes its replies (and their replies, recursively) - deliberate, so a removed
-- comment never leaves orphaned replies dangling under a "deleted" placeholder.

CREATE TABLE post_comments (
    id                    BIGSERIAL PRIMARY KEY,
    post_id               BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_comment_id     BIGINT REFERENCES post_comments(id) ON DELETE CASCADE,
    author_id             BIGINT NOT NULL,
    anonymous_handle      VARCHAR(50) NOT NULL,
    content               TEXT NOT NULL,
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now(),
    is_edited             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_post_comments_post ON post_comments (post_id, created_at ASC);
CREATE INDEX idx_post_comments_parent ON post_comments (parent_comment_id);
