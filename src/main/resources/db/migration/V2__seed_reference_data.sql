-- Reference/lookup data the app needs to function on a freshly created database.
-- Content rows (skins, articles, counsellors, mentors, events) are realistic
-- placeholders, not final copy - swap them for the studio's real content whenever
-- ready, the schema doesn't change either way.

-- ----------------------------------------------------------------------------
-- Tree shop skins (cost is in leaves; the default skin must be free/cost 0)
-- ----------------------------------------------------------------------------
INSERT INTO tree_skins (code, emoji, name, cost, sort_order) VALUES
    ('CLASSIC',  '🌳', 'Classic Oak',     0,   0),
    ('BLOSSOM',  '🌸', 'Cherry Blossom',  150, 1),
    ('MAPLE',    '🍁', 'Autumn Maple',    150, 2),
    ('PINE',     '🌲', 'Evergreen Pine',  200, 3),
    ('PALM',     '🌴', 'Palm Breeze',     250, 4),
    ('GOLDEN',   '🌟', 'Golden Canopy',   400, 5);

-- ----------------------------------------------------------------------------
-- Daily goal templates - keys must match the frontend's INITIAL_GOALS ids
-- (mood-checkin / gratitude-note / breathing) so the toggle endpoint can be
-- called with the same identifiers the UI already uses.
-- ----------------------------------------------------------------------------
INSERT INTO daily_goal_templates (key, label, xp, active, sort_order) VALUES
    ('mood-checkin',  'Log today''s mood',        10, TRUE, 0),
    ('gratitude-note', 'Add a gratitude note',     10, TRUE, 1),
    ('breathing',      'Complete a breathing session', 15, TRUE, 2);

-- ----------------------------------------------------------------------------
-- Pro subscription plans - GHS via Paystack, amounts in pesewas (subunit)
-- ----------------------------------------------------------------------------
INSERT INTO subscription_plans (code, name, price_pesewas, billing_interval, trial_days) VALUES
    ('MONTHLY', 'MoodMate Pro - Monthly', 1500,  'MONTH', 7),
    ('YEARLY',  'MoodMate Pro - Yearly',  12000, 'YEAR',  7);

-- ----------------------------------------------------------------------------
-- Leaf packs - in-app currency top-ups via Paystack
-- ----------------------------------------------------------------------------
INSERT INTO leaf_packs (code, leaves, price_pesewas, sort_order) VALUES
    ('PACK_100', 100, 500,  0),
    ('PACK_300', 300, 1200, 1),
    ('PACK_700', 700, 2500, 2);

-- ----------------------------------------------------------------------------
-- SOS / crisis resources - PLACEHOLDER, VERIFY BEFORE SHIPPING.
-- Numbers below were pulled from public directories in June 2026
-- (Mental Health Authority Ghana via findahelpline.com; Ghana's unified
-- emergency line via multiple Ghanaian public-service sources). Confirm both
-- are still live and correct before this reaches a real user - a wrong crisis
-- number is worse than none.
-- ----------------------------------------------------------------------------
INSERT INTO sos_resources (name, description, phone, url, country, sort_order) VALUES
    ('Emergency Services (Ghana)', 'Immediate danger - connects to police, fire, or ambulance.', '112', NULL, 'GH', 0),
    ('Mental Health Authority Ghana - Psychosocial Support Line', 'Free, toll-free crisis and emotional support line.', '0800678678', 'https://mha-ghana.com', 'GH', 1),
    ('Find A Helpline (global directory)', 'If you''re outside Ghana, find a local, vetted crisis line.', NULL, 'https://findahelpline.com', 'INTL', 2);

-- ----------------------------------------------------------------------------
-- Support: sample counsellors & peer mentors (placeholder roster)
-- ----------------------------------------------------------------------------
INSERT INTO counsellors (name, title, bio, avatar_emoji, specialties, is_available, sort_order) VALUES
    ('Dr. Ama Boateng', 'Clinical Psychologist', 'Specializes in academic stress and anxiety in young adults.', '🧑‍⚕️', 'anxiety,academic stress', TRUE, 0),
    ('Kwame Asante, LPC', 'Licensed Professional Counsellor', 'Focuses on depression, grief, and life transitions.', '👨‍⚕️', 'depression,grief', TRUE, 1);

INSERT INTO peer_mentors (name, bio, avatar_emoji, focus_area, is_available, sort_order) VALUES
    ('Efua', 'Final-year student, here to listen and share what helped her through burnout.', '🌱', 'burnout,student life', TRUE, 0),
    ('Kojo', 'Peer mentor focused on loneliness and building healthy routines.', '🌿', 'loneliness,habits', TRUE, 1);

-- ----------------------------------------------------------------------------
-- Wellness hub: sample articles & events (placeholder content)
-- ----------------------------------------------------------------------------
INSERT INTO wellness_articles (title, summary, body, category, read_minutes, image_emoji) VALUES
    ('Five-minute grounding when anxiety spikes', 'A quick sensory exercise you can do anywhere.', 'When anxiety spikes, try the 5-4-3-2-1 technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This pulls your attention back into the present moment.', 'ANXIETY', 3, '🌬️'),
    ('Why sleep debt hits harder during exam season', 'The link between sleep and stress resilience.', 'Sleep debt reduces your ability to regulate emotion, making normal stressors feel bigger than they are. Protecting even 6-7 hours during exam season measurably improves mood stability.', 'SLEEP', 5, '😴');

INSERT INTO wellness_events (title, description, starts_at, location, capacity) VALUES
    ('Group breathing & journaling circle', 'A guided 30-minute session combining breathwork and reflective journaling.', now() + interval '7 days', 'Student Wellness Center, Room 2', 20),
    ('Peer support drop-in hour', 'Informal, no-signup-needed drop-in with peer mentors.', now() + interval '3 days', 'Online (link shared after RSVP)', NULL);
