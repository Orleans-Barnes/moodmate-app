-- Feature 11 (AI Safety Improvements): tracks that a user has actually seen and acknowledged the
-- AI disclaimer, not just that the frontend once rendered some text. Versioned so a future change
-- to the disclaimer's wording (e.g. a legal/policy update) can force re-acknowledgement - an old
-- acknowledged_version lower than the current moodmate.ai-safety.disclaimer-version means the user
-- must acknowledge again (see AiSafetyService.getDisclaimer()).

CREATE TABLE ai_disclaimer_acknowledgements (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    acknowledged_version INTEGER NOT NULL,
    acknowledged_at     TIMESTAMP NOT NULL DEFAULT now()
);
