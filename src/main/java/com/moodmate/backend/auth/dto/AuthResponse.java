package com.moodmate.backend.auth.dto;

public record AuthResponse(String token, UserProfileResponse user) {
}
