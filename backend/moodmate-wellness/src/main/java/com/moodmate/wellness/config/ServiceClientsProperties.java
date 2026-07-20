package com.moodmate.wellness.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URL for the direct (non-gateway) service-to-service call to wallet-service. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String walletBaseUrl) {
}
