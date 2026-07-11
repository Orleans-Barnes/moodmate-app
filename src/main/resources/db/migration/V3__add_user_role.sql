-- Adds account role (student / counsellor / admin) to users. Plain VARCHAR + CHECK,
-- not a native Postgres ENUM type, so adding a future role is a one-line constraint
-- change instead of an ALTER TYPE migration. Existing rows default to STUDENT.
ALTER TABLE users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'STUDENT';

ALTER TABLE users
    ADD CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'COUNSELLOR', 'ADMIN'));
