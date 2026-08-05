-- Premium & Monetization (Milestone 3) - grace period before hard expiry. A lapsed ACTIVE
-- subscription now transitions to PAST_DUE (reusing the existing, previously-unused enum value)
-- with grace_ends_at set, instead of jumping straight to EXPIRED. Nullable/additive - existing
-- rows are unaffected until the next SubscriptionExpiryJob run touches them.
ALTER TABLE user_subscriptions ADD COLUMN grace_ends_at TIMESTAMP;
