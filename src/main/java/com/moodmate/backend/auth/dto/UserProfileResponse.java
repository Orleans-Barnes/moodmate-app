package com.moodmate.backend.auth.dto;

import com.moodmate.backend.auth.Role;

public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        String institution,
        String avatarEmoji,
        String avatarUrl,   // null when user hasn't uploaded a photo; front-end falls back to avatarEmoji
        boolean guest,
        Role role
) {
}
