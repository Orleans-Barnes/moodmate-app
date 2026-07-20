-- Reference/lookup data this service needs to function on a freshly created database. Pulled from
-- the monolith's shared V2 seed file, scoped down to only the tables wellness-service owns (daily
-- goal templates, wellness articles, wellness events) - the rest of that file's original content
-- (skins, leaf packs, subscription plans, SOS resources, counsellors) belongs to other services'
-- own V2 migrations.

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
-- Wellness hub: sample articles & events (placeholder content)
-- ----------------------------------------------------------------------------
INSERT INTO wellness_articles (title, summary, body, category, read_minutes, image_emoji) VALUES
    ('Five-minute grounding when anxiety spikes', 'A quick sensory exercise you can do anywhere.', 'When anxiety spikes, try the 5-4-3-2-1 technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This pulls your attention back into the present moment.', 'ANXIETY', 3, '🌬️'),
    ('Why sleep debt hits harder during exam season', 'The link between sleep and stress resilience.', 'Sleep debt reduces your ability to regulate emotion, making normal stressors feel bigger than they are. Protecting even 6-7 hours during exam season measurably improves mood stability.', 'SLEEP', 5, '😴');

INSERT INTO wellness_events (title, description, starts_at, location, capacity) VALUES
    ('Group breathing & journaling circle', 'A guided 30-minute session combining breathwork and reflective journaling.', now() + interval '7 days', 'Student Wellness Center, Room 2', 20),
    ('Peer support drop-in hour', 'Informal, no-signup-needed drop-in with peer mentors.', now() + interval '3 days', 'Online (link shared after RSVP)', NULL);
