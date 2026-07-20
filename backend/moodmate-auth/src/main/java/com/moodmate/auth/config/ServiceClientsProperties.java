package com.moodmate.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service address for admin-service - new for Phase 1H (Audit
 * Logs)'s AuditLogServiceClient. Same pattern as every other service's ServiceClientsProperties
 * in this project (e.g. moodmate-crisis's, which has authBaseUrl instead). This is auth-service's
 * first outbound call to another service - everything before this was auth being called, never
 * calling out. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String adminBaseUrl) {
}
