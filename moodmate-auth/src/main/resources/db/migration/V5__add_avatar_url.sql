-- Backs POST /api/users/me/avatar. Null until the user uploads a real photo; the frontend falls
-- back to rendering avatar_emoji when this is null (see UserDto.avatarUrl / User.java's comment).
ALTER TABLE users
    ADD COLUMN avatar_url VARCHAR(500);
