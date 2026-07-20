package com.moodmate.community.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service address(es) - same pattern as
 * moodmate-wellness/moodmate-ai/moodmate-journal's ServiceClientsProperties. authBaseUrl added
 * for Feature 7 (Community Moderation)'s AuthServiceClient. adminBaseUrl added Phase 1H (Audit
 * Logs) for AuditLogServiceClient. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String authBaseUrl, String adminBaseUrl) {
}
