package com.moodmate.crisis.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service address for auth-service - new for Feature 9
 * (Notification Deep Linking)'s AuthServiceClient. Same pattern as every other service's
 * ServiceClientsProperties in this project. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String authBaseUrl) {
}
