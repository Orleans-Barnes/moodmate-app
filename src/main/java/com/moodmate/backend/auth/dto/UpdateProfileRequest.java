package com.moodmate.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank String fullName,
        String institution,
        String avatarEmoji
) {
}
