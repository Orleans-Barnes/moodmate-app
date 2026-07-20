package com.moodmate.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service addresses - same pattern as moodmate-wellness's
 * ServiceClientsProperties. walletBaseUrl added for Premium Enforcement (PaymentsServiceClient). */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String moodBaseUrl, String crisisBaseUrl, String walletBaseUrl) {
}
