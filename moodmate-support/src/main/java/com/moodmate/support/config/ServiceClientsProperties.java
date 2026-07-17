package com.moodmate.support.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URL for the direct (non-gateway) service-to-service calls to auth-service. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String authBaseUrl) {
}
