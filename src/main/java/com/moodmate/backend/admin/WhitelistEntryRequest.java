package com.moodmate.backend.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WhitelistEntryRequest(
        @NotBlank @Email String email,
        @Size(max = 500) String notes
) {}
