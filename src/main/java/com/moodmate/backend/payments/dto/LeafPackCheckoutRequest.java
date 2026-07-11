package com.moodmate.backend.payments.dto;

import jakarta.validation.constraints.NotBlank;

public record LeafPackCheckoutRequest(@NotBlank String packCode) {
}
