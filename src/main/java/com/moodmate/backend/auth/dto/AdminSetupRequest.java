package com.moodmate.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * One-shot bootstrap DTO.
 * Only accepted by POST /api/auth/admin-setup while no ADMIN account exists yet.
 * Once the first admin is created the endpoint permanently returns 409.
 */
public record AdminSetupRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank String fullName
) {}
