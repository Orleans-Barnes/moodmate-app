-- Reference/lookup data this service needs to function on a freshly created database. Pulled from
-- the monolith's shared V2 seed file, scoped down to only the tables wallet-service owns (skins,
-- leaf packs, subscription plans) - the rest of that file's original content (SOS resources,
-- counsellors, wellness articles, etc.) belongs to other services' own V2 migrations.

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
