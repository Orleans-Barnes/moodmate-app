package com.moodmate.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for both POST /api/auth/refresh and POST /api/auth/logout - same shape, different
 * meaning (rotate vs. revoke) applied by the two AuthService methods. */
public record RefreshTokenRequest(@NotBlank String refreshToken) {
}
