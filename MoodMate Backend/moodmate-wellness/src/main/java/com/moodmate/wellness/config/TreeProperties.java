package com.moodmate.wellness.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * leafRewardPerDay is new - it didn't exist in the monolith. GoalEngine's own class doc there
 * said "Crediting leaves (goal/checkin/gratitude rewards...) never fails," and the
 * LeafTransactionReason enum had a GOAL_REWARD value, but nothing ever actually called into the
 * wallet with it (see fix #2 in the review) - the reward amount was never decided, only implied.
 * Defaulting to 10 leaves here as a placeholder so the wiring works end-to-end; please confirm
 * the real number with product before this goes anywhere near real users.
 */
@ConfigurationProperties(prefix = "moodmate.tree")
public record TreeProperties(int xpMax, int leafRewardPerDay, int streakShieldCostLeaves,
                              int doubleXpCostLeaves, int doubleXpDurationHours) {
}
