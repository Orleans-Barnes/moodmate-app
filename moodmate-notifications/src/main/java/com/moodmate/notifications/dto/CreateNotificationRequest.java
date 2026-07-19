package com.moodmate.notifications.dto;

import com.moodmate.notifications.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Internal-only creation request (POST /internal/notifications) - every other service is a
 * producer that sends one of these rather than writing into this schema directly (see
 * InternalNotificationController's doc comment). scheduledAt is optional: null/omitted means
 * "deliver as soon as possible" (status starts PENDING); a future Instant means "not due yet"
 * (status starts SCHEDULED) - Step 4's scheduling-rules job is what actually flips SCHEDULED rows
 * to DELIVERED once due, this endpoint only records intent.
 */
public record CreateNotificationRequest(
    @NotNull Long userId,
    @NotNull NotificationType type,
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 1000) String body,
    String destinationScreen,
    String destinationParams,
    Instant scheduledAt,
    String metadata
) {}
