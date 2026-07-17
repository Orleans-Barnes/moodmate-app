package com.moodmate.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record WhitelistAddRequest(@NotBlank @Email String email, String notes) {
}
