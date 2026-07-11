-- Allows users to upload a real profile photo.
-- avatar_emoji is kept as the fallback when no photo has been set.
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
