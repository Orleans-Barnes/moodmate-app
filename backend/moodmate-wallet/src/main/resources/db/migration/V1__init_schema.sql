-- Wallet service schema: leaves/currency, tree skins, and Paystack-backed payments/subscriptions.
-- user_id columns below reference auth-service's users.id BY VALUE, not a FOREIGN KEY - this
-- service's schema can no longer see auth-service's schema, so referential integrity across
-- services is enforced in application code (each service trusts the X-User-Id the gateway
-- forwards, which came from a verified JWT), not the database.

-- ============================================================================
-- GAMIFICATION / TREE SHOP
-- ============================================================================

CREATE TABLE tree_skins (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,
    emoji       VARCHAR(10) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    cost        INT NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0
);

-- Didn't exist as its own table in the monolith - leafBalance lived on wellness's
-- wellness_profiles row there. Owned here instead since wallet, not wellness, should own
-- money/cosmetics state.
CREATE TABLE leaf_wallets (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    leaf_balance        INT NOT NULL DEFAULT 0,
    equipped_skin_id    BIGINT REFERENCES tree_skins(id),
    updated_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE leaf_transactions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    amount      INT NOT NULL,           -- positive = earn, negative = spend
    reason      VARCHAR(50) NOT NULL,   -- GOAL_REWARD, CHECKIN_REWARD, GRATITUDE_REWARD, SKIN_PURCHASE, LEAF_PACK_PURCHASE, GAME_REWARD
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_leaf_transactions_user_created ON leaf_transactions (user_id, created_at);

-- Which paid skins a user already owns, so re-equipping a previously bought skin never charges
-- leaves twice. Free skins (cost 0) don't need a row here.
CREATE TABLE user_owned_skins (
    user_id     BIGINT NOT NULL,
    skin_id     BIGINT NOT NULL REFERENCES tree_skins(id),
    acquired_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, skin_id)
);

-- ============================================================================
-- SUBSCRIPTIONS & PAYSTACK PAYMENTS (test-mode Paystack integration)
-- ============================================================================

CREATE TABLE subscription_plans (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(20) NOT NULL UNIQUE,   -- MONTHLY, YEARLY
    name                VARCHAR(100) NOT NULL,
    price_pesewas       INT NOT NULL,                  -- GHS subunit
    billing_interval    VARCHAR(10) NOT NULL,          -- MONTH, YEAR
    trial_days          INT NOT NULL DEFAULT 0
);

CREATE TABLE user_subscriptions (
    id                              BIGSERIAL PRIMARY KEY,
    user_id                         BIGINT NOT NULL UNIQUE,
    plan_code                       VARCHAR(20) NOT NULL REFERENCES subscription_plans(code),
    status                          VARCHAR(20) NOT NULL DEFAULT 'TRIALING', -- TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED
    trial_ends_at                   TIMESTAMP,
    current_period_end              TIMESTAMP,
    paystack_customer_code          VARCHAR(100),
    paystack_authorization_code     VARCHAR(100),
    created_at                      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE leaf_packs (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,   -- PACK_100, PACK_300, PACK_700
    leaves          INT NOT NULL,
    price_pesewas   INT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE payment_transactions (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT NOT NULL,
    reference                   VARCHAR(100) NOT NULL UNIQUE,   -- Paystack transaction reference
    purpose                     VARCHAR(20) NOT NULL,           -- SUBSCRIPTION, LEAF_PACK
    item_code                   VARCHAR(20) NOT NULL,           -- plan code or leaf pack code
    amount_pesewas              INT NOT NULL,
    currency                    VARCHAR(10) NOT NULL DEFAULT 'GHS',
    status                      VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, ABANDONED
    paystack_transaction_id     BIGINT,
    channel                     VARCHAR(30),
    paid_at                     TIMESTAMP,
    created_at                  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions (user_id, created_at);
