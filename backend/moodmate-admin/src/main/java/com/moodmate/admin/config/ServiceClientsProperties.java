package com.moodmate.admin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service address for notifications-service - new for Phase 1H
 * (System Settings - Admin Announcement broadcast)'s NotificationsServiceClient. Same pattern as
 * every other service's ServiceClientsProperties in this project. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String notificationsBaseUrl) {
}
