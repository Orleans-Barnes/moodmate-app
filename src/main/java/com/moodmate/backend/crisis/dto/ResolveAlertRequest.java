package com.moodmate.backend.crisis.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveAlertRequest(
        @NotNull CrisisAlertAction action,
        @Size(max = 1000) String notes
) {}
