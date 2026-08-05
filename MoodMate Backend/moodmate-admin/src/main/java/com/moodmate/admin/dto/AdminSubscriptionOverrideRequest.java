package com.moodmate.admin.dto;

import jakarta.validation.constraints.NotBlank;

/** Premium & Monetization (Milestone 3) - admin override request from the frontend admin UI.
 * status is "ACTIVE" (grant) or "EXPIRED" (revoke), forwarded as-is to wallet-service's
 * AdminOverrideSubscriptionRequest, same "duplicate DTO shape locally" convention as
 * RevenueSummaryView. */
public record AdminSubscriptionOverrideRequest(@NotBlank String status, Integer extendDays) {
}
