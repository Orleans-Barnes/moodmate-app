-- MoodMate full schema: auth, gamification/tree-shop, mood check-ins, journal,
-- gratitude jar, community, support (counsellors/mentors/appointments/messaging),
-- wellness hub (articles/events), SOS crisis resources, and Pro subscriptions +
-- Paystack-backed payments. Built fresh - does not reuse the older MVP-only draft.

-- ============================================================================
-- AUTH / USERS
-- ============================================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),                 -- null for guest accounts
    full_name       VARCHAR(255) NOT NULL,
    institution     VARCHAR(255),
    avatar_emoji    VARCHAR(10) NOT NULL DEFAULT '🙂',
    is_guest        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================================
-- GAMIFICATION: tree XP/streak, daily goals, leaf wallet, tree shop
-- ============================================================================

CREATE TABLE tree_skins (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,
    emoji       VARCHAR(10) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    cost        INT NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE wellness_profiles (
    user_id                         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tree_xp                         INT NOT NULL DEFAULT 0,
    tree_stage                      VARCHAR(20) NOT NULL DEFAULT 'ROOTS',
    tree_skin_id                    BIGINT NOT NULL REFERENCES tree_skins(id),
    leaf_balance                    INT NOT NULL DEFAULT 0,
    streak_count                    INT NOT NULL DEFAULT 0,
    last_all_goals_completed_date   DATE,
    updated_at                      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE daily_goal_templates (
    id          BIGSERIAL PRIMARY KEY,
    key         VARCHAR(50) NOT NULL UNIQUE,
    label       VARCHAR(255) NOT NULL,
    xp          INT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE goal_completions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_template_id    BIGINT NOT NULL REFERENCES daily_goal_templates(id),
    completion_date     DATE NOT NULL,
    done                BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, goal_template_id, completion_date)
);

CREATE INDEX idx_goal_completions_user_date ON goal_completions (user_id, completion_date);

CREATE TABLE leaf_transactions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INT NOT NULL,           -- positive = earn, negative = spend
    reason      VARCHAR(50) NOT NULL,   -- GOAL_REWARD, CHECKIN_REWARD, GRATITUDE_REWARD, SKIN_PURCHASE, LEAF_PACK_PURCHASE, GAME_REWARD
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_leaf_transactions_user_created ON leaf_transactions (user_id, created_at);

-- Which paid skins a user already owns, so re-equipping a previously bought skin
-- never charges leaves twice. Free skins (cost 0) don't need a row here.
CREATE TABLE user_owned_skins (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skin_id     BIGINT NOT NULL REFERENCES tree_skins(id),
    acquired_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, skin_id)
);

-- ============================================================================
-- MOOD CHECK-INS  (always free, never gated behind Pro)
-- ============================================================================

CREATE TABLE mood_checkins (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emotion_key     VARCHAR(50) NOT NULL,   -- matches frontend EMOTIONS labels, e.g. HAPPY/CALM/ANXIOUS
    stress_level    SMALLINT NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
    energy_level    SMALLINT NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_mood_checkins_user_created ON mood_checkins (user_id, created_at);

-- ============================================================================
-- JOURNAL & GRATITUDE JAR
-- ============================================================================

CREATE TABLE journal_entries (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    body        TEXT NOT NULL,
    mood_emoji  VARCHAR(10),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_entries_user_created ON journal_entries (user_id, created_at);

CREATE TABLE gratitude_entries (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_gratitude_entries_user_created ON gratitude_entries (user_id, created_at);

-- ============================================================================
-- COMMUNITY  (anonymous posts - per-post handle, not a stable per-user pseudonym)
-- ============================================================================

CREATE TABLE community_posts (
    id                  BIGSERIAL PRIMARY KEY,
    author_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anonymous_handle    VARCHAR(50) NOT NULL,   -- e.g. "Anonymous Owl" - generated per post
    topic               VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    content             TEXT NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_created ON community_posts (created_at DESC);
CREATE INDEX idx_community_posts_topic_created ON community_posts (topic, created_at DESC);

CREATE TABLE post_reactions (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type   VARCHAR(20) NOT NULL DEFAULT 'HEART',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)   -- one reaction per user per post; changing it updates the row
);

CREATE INDEX idx_post_reactions_post ON post_reactions (post_id);

-- ============================================================================
-- SUPPORT: counsellors, peer mentors, appointments, 1:1 messaging
-- ============================================================================

CREATE TABLE counsellors (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    title           VARCHAR(255),
    bio             TEXT,
    avatar_emoji    VARCHAR(10) NOT NULL DEFAULT '🧑‍⚕️',
    specialties     VARCHAR(500),       -- comma-separated tags, e.g. "anxiety,academic stress"
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE peer_mentors (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    bio             TEXT,
    avatar_emoji    VARCHAR(10) NOT NULL DEFAULT '🌱',
    focus_area      VARCHAR(255),
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE appointments (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counsellor_id   BIGINT NOT NULL REFERENCES counsellors(id),
    scheduled_at    TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED, COMPLETED
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_user ON appointments (user_id, scheduled_at);
CREATE INDEX idx_appointments_counsellor ON appointments (counsellor_id, scheduled_at);

-- A conversation is between one user and exactly one counsellor OR one peer mentor
-- (never both - enforced in the service layer, not the DB, to keep this portable).
CREATE TABLE conversations (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counsellor_id   BIGINT REFERENCES counsellors(id),
    peer_mentor_id  BIGINT REFERENCES peer_mentors(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (
        (counsellor_id IS NOT NULL AND peer_mentor_id IS NULL) OR
        (counsellor_id IS NULL AND peer_mentor_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_conversation_user_counsellor ON conversations (user_id, counsellor_id) WHERE counsellor_id IS NOT NULL;
CREATE UNIQUE INDEX uq_conversation_user_mentor ON conversations (user_id, peer_mentor_id) WHERE peer_mentor_id IS NOT NULL;

CREATE TABLE support_messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type     VARCHAR(20) NOT NULL,   -- USER, COUNSELLOR, PEER_MENTOR
    body            TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    read_at         TIMESTAMP
);

CREATE INDEX idx_support_messages_conversation ON support_messages (conversation_id, created_at);

-- ============================================================================
-- WELLNESS HUB: articles & events
-- ============================================================================

CREATE TABLE wellness_articles (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    summary         VARCHAR(500),
    body            TEXT NOT NULL,
    category        VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    read_minutes    INT NOT NULL DEFAULT 3,
    image_emoji     VARCHAR(10) NOT NULL DEFAULT '📘',
    published_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_wellness_articles_published ON wellness_articles (published_at DESC);

CREATE TABLE wellness_events (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    starts_at       TIMESTAMP NOT NULL,
    location        VARCHAR(255),
    capacity        INT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_wellness_events_starts ON wellness_events (starts_at);

CREATE TABLE event_rsvps (
    id          BIGSERIAL PRIMARY KEY,
    event_id    BIGINT NOT NULL REFERENCES wellness_events(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (event_id, user_id)
);

-- ============================================================================
-- SOS / CRISIS RESOURCES  (public, unauthenticated, never paywalled)
-- ============================================================================

CREATE TABLE sos_resources (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(500),
    phone           VARCHAR(50),
    url             VARCHAR(255),
    country         VARCHAR(10) NOT NULL DEFAULT 'GH',
    sort_order      INT NOT NULL DEFAULT 0
);

-- ============================================================================
-- SUBSCRIPTIONS & PAYSTACK PAYMENTS  (test-mode Paystack integration)
-- ============================================================================

CREATE TABLE subscription_plans (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,   -- MONTHLY, YEARLY
    name            VARCHAR(100) NOT NULL,
    price_pesewas   INT NOT NULL,                  -- GHS subunit
    billing_interval VARCHAR(10) NOT NULL,         -- MONTH, YEAR
    trial_days      INT NOT NULL DEFAULT 0
);

CREATE TABLE user_subscriptions (
    id                              BIGSERIAL PRIMARY KEY,
    user_id                         BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
    user_id                     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
