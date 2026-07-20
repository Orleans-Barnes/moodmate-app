package com.moodmate.wallet.dto;

import jakarta.validation.constraints.NotBlank;

public record SubscriptionCheckoutRequest(@NotBlank String planCode) {
}
