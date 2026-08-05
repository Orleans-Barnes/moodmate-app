package com.moodmate.crisis.dto;

import com.moodmate.crisis.entity.CrisisSeverity;
import com.moodmate.crisis.entity.CrisisSource;
import com.moodmate.crisis.entity.CrisisStatus;

import java.time.Instant;

/** Mirrors the frontend's CrisisAlertDto exactly (src/api/crisis.ts). */
public record CrisisAlertDto(
        Long id,
        Long userId,
        String triggerText,
        String matchedKeywords,
        CrisisSeverity severity,
        CrisisSource source,
        CrisisStatus status,
        Long handledByCounsellorId,
        String resolutionNotes,
        Instant createdAt,
        Instant acknowledgedAt,
        Instant resolvedAt
) {}
