package com.moodmate.support.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Base URLs for direct (non-gateway) service-to-service calls. adminBaseUrl added Phase 1H
 * (Audit Logs) for AuditLogServiceClient. walletBaseUrl added for Premium gating breadth
 * (Milestone item 7) - PaymentsServiceClient. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String authBaseUrl, String adminBaseUrl, String walletBaseUrl) {
}
