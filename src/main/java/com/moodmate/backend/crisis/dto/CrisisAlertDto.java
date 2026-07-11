package com.moodmate.backend.crisis.dto;

import com.moodmate.backend.crisis.CrisisAlert;
import com.moodmate.backend.crisis.CrisisSeverity;
import com.moodmate.backend.crisis.CrisisSource;
import com.moodmate.backend.crisis.CrisisStatus;

import java.time.Instant;

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
) {
    public static CrisisAlertDto from(CrisisAlert a) {
        return new CrisisAlertDto(
                a.getId(), a.getUserId(),
                a.getTriggerText(), a.getMatchedKeywords(),
                a.getSeverity(), a.getSource(), a.getStatus(),
                a.getHandledByCounsellorId(), a.getResolutionNotes(),
                a.getCreatedAt(), a.getAcknowledgedAt(), a.getResolvedAt()
        );
    }
}
