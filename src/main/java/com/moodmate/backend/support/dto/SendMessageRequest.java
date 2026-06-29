package com.moodmate.backend.support.dto;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(@NotBlank String body) {
}
