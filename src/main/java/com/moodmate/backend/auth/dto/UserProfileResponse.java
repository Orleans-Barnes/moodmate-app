package com.moodmate.backend.auth.dto;

public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        String institution,
        String avatarEmoji,
        boolean guest
) {
}
