-- Support-owned seed data only (counsellors/mentors roster and SOS crisis resources) - trimmed
-- from the monolith's V2__seed_reference_data.sql, which also seeded tree skins, goal templates,
-- subscription plans, and leaf packs that belong to other services now.

-- ----------------------------------------------------------------------------
-- Support: sample counsellors & peer mentors (placeholder roster, pre-approved)
-- ----------------------------------------------------------------------------
INSERT INTO counsellors (name, title, bio, avatar_emoji, specialties, is_available, sort_order, status) VALUES
    ('Dr. Ama Boateng', 'Clinical Psychologist', 'Specializes in academic stress and anxiety in young adults.', '🧑‍⚕️', 'anxiety,academic stress', TRUE, 0, 'APPROVED'),
    ('Kwame Asante, LPC', 'Licensed Professional Counsellor', 'Focuses on depression, grief, and life transitions.', '👨‍⚕️', 'depression,grief', TRUE, 1, 'APPROVED');

INSERT INTO peer_mentors (name, bio, avatar_emoji, focus_area, is_available, sort_order) VALUES
    ('Efua', 'Final-year student, here to listen and share what helped her through burnout.', '🌱', 'burnout,student life', TRUE, 0),
    ('Kojo', 'Peer mentor focused on loneliness and building healthy routines.', '🌿', 'loneliness,habits', TRUE, 1);

-- ----------------------------------------------------------------------------
-- SOS / crisis resources - PLACEHOLDER, VERIFY BEFORE SHIPPING.
-- Numbers below were pulled from public directories in June 2026 (Mental Health Authority Ghana
-- via findahelpline.com; Ghana's unified emergency line via multiple Ghanaian public-service
-- sources). Confirm both are still live and correct before this reaches a real user - a wrong
-- crisis number is worse than none.
-- ----------------------------------------------------------------------------
INSERT INTO sos_resources (name, description, phone, url, country, sort_order) VALUES
    ('Emergency Services (Ghana)', 'Immediate danger - connects to police, fire, or ambulance.', '112', NULL, 'GH', 0),
    ('Mental Health Authority Ghana - Psychosocial Support Line', 'Free, toll-free crisis and emotional support line.', '0800678678', 'https://mha-ghana.com', 'GH', 1),
    ('Find A Helpline (global directory)', 'If you''re outside Ghana, find a local, vetted crisis line.', NULL, 'https://findahelpline.com', 'INTL', 2);
