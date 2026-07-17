package com.moodmate.wallet.dto;

import jakarta.validation.constraints.NotBlank;

public record LeafPackCheckoutRequest(@NotBlank String packCode) {
}
