-- Feature 7 (Community Moderation): user-submitted reports on posts/comments, feeding an admin
-- moderation queue. Additive, not in the monolith. content_id has no FK (it can point into either
-- community_posts or post_comments depending on content_type, so a single real FK isn't possible)
-- - post_id is stored separately purely for admin context/navigation (for a COMMENT report, it's
-- the comment's own post_id; for a POST report, it equals content_id).
--
-- UNIQUE(content_type, content_id, reporter_id) caps one report per user per content item -
-- repeated reports from the same person don't multiply the queue; the moderation queue is instead
-- driven by distinct reporters flagging the same item.

CREATE TABLE content_reports (
    id              BIGSERIAL PRIMARY KEY,
    content_type    VARCHAR(10) NOT NULL,           -- POST or COMMENT
    content_id      BIGINT NOT NULL,
    post_id         BIGINT NOT NULL,
    reporter_id     BIGINT NOT NULL,
    reason          VARCHAR(500) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, DISMISSED, CONTENT_REMOVED
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMP,
    resolved_by     BIGINT,
    UNIQUE (content_type, content_id, reporter_id)
);

CREATE INDEX idx_content_reports_status_created ON content_reports (status, created_at ASC);
CREATE INDEX idx_content_reports_content ON content_reports (content_type, content_id);
