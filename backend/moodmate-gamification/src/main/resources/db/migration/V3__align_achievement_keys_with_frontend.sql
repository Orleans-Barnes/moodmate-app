-- Reconciles the achievement catalog with the frontend's 10-badge set
-- (src/state/useGamificationStore.ts BADGE_DEFS), now that the gamification screens are being
-- wired to this service for real. Non-destructive: a placeholder key is only removed if no user
-- has actually earned it yet - user_achievements.achievement_key has a FK to achievements(key),
-- so the DELETE below is a safe no-op (blocked by nothing, since the NOT EXISTS guard skips any
-- key that's actually referenced) even if this runs against a DB with real earned achievements.

DELETE FROM achievements a
WHERE a.key IN ('SEVEN_DAY_STREAK', 'FIRST_JOURNAL', 'GRATITUDE_FIVE')
  AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.achievement_key = a.key);

-- FIRST_CHECKIN is left untouched - it already matches the frontend's 'first_checkin' badge id
-- (uppercased) exactly, both in key and in intent.
INSERT INTO achievements (key, title, description, icon_name, xp_reward, leaf_reward) VALUES
    ('STREAK_3',        '3-Day Streak',     'Check in 3 days in a row.',                 'flame',  60, 10),
    ('STREAK_7',        'Week Warrior',     'Maintain a 7-day streak.',                  'flame', 100, 25),
    ('STREAK_30',       'Monthly Legend',   '30-day streak - unstoppable!',              'trophy',200, 50),
    ('JOURNALLER',      'Journaller',       'Write 3 journal entries.',                  'book',   50, 10),
    ('DEEP_BREATHER',   'Deep Breather',    'Complete 3 breathing sessions.',             'lungs',  50, 10),
    ('COMMUNITY_VOICE', 'Community Voice',  'Post something in the community.',           'chat',   40, 10),
    ('GRATEFUL_HEART',  'Grateful Heart',   'Add 3 gratitude notes.',                     'heart',  50, 10),
    ('XP_100',          'Rising Star',      'Earn 100 XP.',                               'star',   30,  5),
    ('XP_500',          'Wellness Pro',     'Earn 500 XP.',                               'gem',    80, 20)
ON CONFLICT (key) DO NOTHING;
