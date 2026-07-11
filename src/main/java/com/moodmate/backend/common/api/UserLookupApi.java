package com.moodmate.backend.common.api;

import com.moodmate.backend.common.dto.UserSummary;

import java.util.List;
import java.util.Map;

/**
 * Contract for cross-domain user identity lookups.
 *
 * Implemented by {@code auth.AuthService}.
 * Injected by {@code support.SupportService} and {@code payments.PaymentsService} so those
 * domains can resolve user identity without importing from the auth package directly.
 */
public interface UserLookupApi {

    /** Returns minimal identity data for a single user. Throws if the user doesn't exist. */
    UserSummary getUserSummary(Long userId);

    /** Batch version of {@link #getUserSummary} — one query instead of N round-trips. */
    Map<Long, UserSummary> getUserSummaries(List<Long> userIds);

    /** Returns the user's email address. Used by payments when initialising a Paystack checkout. */
    String getUserEmail(Long userId);
}
