package com.moodmate.backend.support.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @NotBlank @Size(max = 2000, message = "Message must be 2000 characters or fewer") String body
) {
}
