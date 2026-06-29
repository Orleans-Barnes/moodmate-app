package com.moodmate.backend.auth.dto;

import com.moodmate.backend.auth.Role;

public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        String institution,
        String avatarEmoji,
        boolean guest,
        Role role
) {
}
