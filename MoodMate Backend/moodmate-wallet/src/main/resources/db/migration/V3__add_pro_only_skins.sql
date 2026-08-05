-- Premium gating breadth (Milestone item 7) - marks the two highest-tier tree skins as
-- Pro-exclusive, backing ShopScreen's "Exclusive tree skins" copy. Existing free/leaf-purchasable
-- skins (CLASSIC/BLOSSOM/MAPLE/PINE) are unaffected - pro_only defaults false for them.

ALTER TABLE tree_skins ADD COLUMN pro_only BOOLEAN NOT NULL DEFAULT false;

UPDATE tree_skins SET pro_only = true WHERE code IN ('PALM', 'GOLDEN');
