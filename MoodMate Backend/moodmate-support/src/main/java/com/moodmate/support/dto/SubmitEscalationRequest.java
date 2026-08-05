package com.moodmate.support.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitEscalationRequest(
        @NotBlank String studentName,
        @NotBlank String concern,
        String urgency  // defaults to PRIORITY if null/blank
) {}
