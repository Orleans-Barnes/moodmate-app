-- Feature 12 (Journal Improvements): adds the columns/tables needed for Favorites and Tags.
-- Search, Date Filters, and Emotion Filters need no schema change - they query the existing
-- title/body/created_at/mood_emoji columns from V1.

ALTER TABLE journal_entries ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- Supports filtering "show me my favorite entries" without a full table scan.
CREATE INDEX idx_journal_entries_user_favorite ON journal_entries (user_id, is_favorite);

-- One row per (entry, tag). Modeled as a side table (matches the @ElementCollection pattern),
-- not a Postgres TEXT[] column, so it stays queryable with plain JPQL joins and indexable per-tag.
CREATE TABLE journal_entry_tags (
    entry_id    BIGINT NOT NULL REFERENCES journal_entries (id) ON DELETE CASCADE,
    tag         VARCHAR(50) NOT NULL,
    PRIMARY KEY (entry_id, tag)
);

CREATE INDEX idx_journal_entry_tags_tag ON journal_entry_tags (tag);
