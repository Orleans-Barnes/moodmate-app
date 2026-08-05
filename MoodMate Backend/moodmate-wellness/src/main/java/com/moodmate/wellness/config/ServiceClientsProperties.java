package com.moodmate.wellness.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URLs for direct (non-gateway) service-to-service calls. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String walletBaseUrl, String adminBaseUrl,
									   String notificationsBaseUrl) {
}
