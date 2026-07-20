-- Feature 7 (Community Moderation): adds account-level ban/warning state to users. Additive only
-- - no existing column touched. banned_reason/banned_at are nullable (only meaningful while
-- banned=true); warning_count is a simple running total, incremented by warnUser(), never reset
-- automatically (an admin unbanning a user does not clear warnings - a separate, deliberate
-- decision so warning history survives a ban/unban cycle).

ALTER TABLE users ADD COLUMN banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN banned_reason VARCHAR(500);
ALTER TABLE users ADD COLUMN banned_at TIMESTAMP;
ALTER TABLE users ADD COLUMN warning_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_users_banned ON users (banned);
