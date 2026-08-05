-- Placeholder achievements & missions content - swap for real copy whenever ready, the schema
-- doesn't change either way. Themed to match the app's existing tree/streak/leaf language.

INSERT INTO achievements (key, title, description, icon_name, xp_reward, leaf_reward) VALUES
    ('FIRST_CHECKIN',    'First Steps',       'Logged your very first mood check-in.',            'sprout',  50,  10),
    ('SEVEN_DAY_STREAK', 'Week of Growth',    'Kept a 7-day streak going without missing a day.',  'flame',   100, 25),
    ('FIRST_JOURNAL',    'Open Book',         'Wrote your first journal entry.',                   'book',    50,  10),
    ('GRATITUDE_FIVE',   'Grateful Heart',    'Added five gratitude notes to your jar.',           'heart',   75,  15);

INSERT INTO missions (title, description, mission_type, target_count, xp_reward, leaf_reward, expires_on) VALUES
    ('Daily Check-in',       'Log a mood check-in today.',                 'DAILY',  1, 10, 5, NULL),
    ('Breathe & Reflect',    'Complete one breathing session today.',       'DAILY',  1, 15, 5, NULL),
    ('Weekly Reflection',    'Write three journal entries this week.',      'WEEKLY', 3, 30, 15, NULL);
