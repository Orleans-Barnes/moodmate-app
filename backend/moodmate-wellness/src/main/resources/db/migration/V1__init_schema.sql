-- Wellness service schema: goals/tree XP/streak, and the wellness hub (articles/events/RSVPs).
-- user_id columns reference auth-service's users.id BY VALUE, not a FOREIGN KEY - see
-- moodmate-auth's V4 migration comment for why. leaf_balance and tree_skin_id, which lived on
-- this table in the monolith, are NOT here - they moved to wallet-service's leaf_wallets table.

-- ============================================================================
-- GAMIFICATION: tree XP/streak, daily goals
-- ============================================================================

CREATE TABLE wellness_profiles (
    user_id                         BIGINT PRIMARY KEY,
    tree_xp                         INT NOT NULL DEFAULT 0,
    tree_stage                      VARCHAR(20) NOT NULL DEFAULT 'ROOTS',
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
    user_id             BIGINT NOT NULL,
    goal_template_id    BIGINT NOT NULL REFERENCES daily_goal_templates(id),
    completion_date     DATE NOT NULL,
    done                BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, goal_template_id, completion_date)
);

CREATE INDEX idx_goal_completions_user_date ON goal_completions (user_id, completion_date);

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
    user_id     BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (event_id, user_id)
);
