package com.moodmate.admin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service addresses this service calls into. notificationsBaseUrl
 * added for Phase 1H (System Settings - Admin Announcement broadcast)'s NotificationsServiceClient.
 * walletBaseUrl added for Item 8 (Admin Revenue Dashboard)'s RevenueServiceClient. Same pattern as
 * every other service's ServiceClientsProperties in this project. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String notificationsBaseUrl, String walletBaseUrl) {
}
