package com.moodmate.backend.push.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterPushTokenRequest(
        @NotBlank String token
) {}
