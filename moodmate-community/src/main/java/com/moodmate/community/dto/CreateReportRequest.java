package com.moodmate.community.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateReportRequest(@NotBlank String reason) {
}
