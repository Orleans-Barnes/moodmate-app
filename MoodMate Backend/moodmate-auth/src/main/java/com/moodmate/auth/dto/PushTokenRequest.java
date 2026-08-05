package com.moodmate.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record PushTokenRequest(@NotBlank String token) {}
