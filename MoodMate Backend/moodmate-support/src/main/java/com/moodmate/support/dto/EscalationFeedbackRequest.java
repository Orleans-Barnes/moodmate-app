package com.moodmate.support.dto;

import jakarta.validation.constraints.NotBlank;

public record EscalationFeedbackRequest(@NotBlank String feedback) {}
