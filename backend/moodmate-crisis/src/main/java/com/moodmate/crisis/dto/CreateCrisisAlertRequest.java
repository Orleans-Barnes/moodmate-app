package com.moodmate.crisis.dto;

import com.moodmate.crisis.entity.CrisisSeverity;
import com.moodmate.crisis.entity.CrisisSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Internal, service-to-service request body for POST /internal/crisis/alerts. Called by
 * moodmate-ai (chat message crisis-keyword match) and moodmate-journal (journal entry
 * crisis-keyword match) - the caller does its own keyword detection/severity classification and
 * just reports the result here; this service performs no text analysis itself.
 */
public record CreateCrisisAlertRequest(
        @NotNull Long userId,
        @NotBlank String triggerText,
        @NotEmpty List<String> matchedKeywords,
        @NotNull CrisisSeverity severity,
        @NotNull CrisisSource source
) {}
