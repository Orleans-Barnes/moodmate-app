package com.moodmate.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Free-tier AI chat cap (Premium Enforcement) - matches the "Basic AI chat (10 messages/day)"
 * line in the project's own business plan (MOODMATE_EXPANSION_PLAN.md). Pro users are exempt -
 * see AiChatService.sendMessage(). */
@ConfigurationProperties(prefix = "moodmate.ai-usage")
public record AiUsageProperties(int freeDailyMessageLimit) {
}
