-- Phase 1G follow-up: Role.java and the frontend already use MENTOR, but V3's original
-- check constraint only allowed STUDENT/COUNSELLOR/ADMIN. Peer mentor self-approval promotes
-- auth.users.role to MENTOR, so the database must accept that role too.
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;

ALTER TABLE users
    ADD CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'COUNSELLOR', 'MENTOR', 'ADMIN'));
