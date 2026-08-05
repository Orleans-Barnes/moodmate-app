package com.moodmate.wallet.dto;

import com.moodmate.wallet.entity.SubscriptionStatus;
import jakarta.validation.constraints.NotNull;

/** Premium & Monetization (Milestone 3) - admin override. Only ACTIVE (grant) and EXPIRED
 * (revoke) are meaningful admin actions; TRIALING/PAST_DUE/CANCELLED are lifecycle-internal states
 * an admin shouldn't set directly through this endpoint. extendDays only applies when
 * status == ACTIVE (defaults to 30 if null) and is otherwise ignored. */
public record AdminOverrideSubscriptionRequest(@NotNull SubscriptionStatus status, Integer extendDays) {
}
