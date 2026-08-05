package com.moodmate.wallet.dto;

import jakarta.validation.constraints.NotBlank;

public record BookCheckoutRequest(@NotBlank String bookCode) {
}
