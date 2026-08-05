package com.moodmate.wallet.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URLs for direct service-to-service calls (not routed through the gateway). adminBaseUrl
 * added for Institution Management (Milestone 2, Step 3-4) - InstitutionServiceClient's
 * license-active check. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String authBaseUrl, String adminBaseUrl) {
}
