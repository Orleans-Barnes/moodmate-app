package com.moodmate.wallet.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URLs for direct service-to-service calls (not routed through the gateway). */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String authBaseUrl) {
}
