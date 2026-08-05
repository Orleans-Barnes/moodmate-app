package com.moodmate.support.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URLs for direct (non-gateway) service-to-service calls. adminBaseUrl added Phase 1H
 * (Audit Logs) for AuditLogServiceClient. walletBaseUrl added for Premium gating breadth
 * (Milestone item 7) - PaymentsServiceClient. notificationsBaseUrl added for Peer Mentor Platform
 * (Milestone 5) - NotificationsServiceClient, this service's first producer into
 * moodmate-notifications' real Notification-row + type + push-gating pipeline (previously,
 * mentor/counsellor notifications only ever called moodmate-auth's ExpoPushClient directly,
 * bypassing the Notification Center, NotificationType, and push-preference gating entirely). */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String authBaseUrl, String adminBaseUrl, String walletBaseUrl,
                                        String notificationsBaseUrl) {
}
