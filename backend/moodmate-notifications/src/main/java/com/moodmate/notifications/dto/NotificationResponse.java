package com.moodmate.notifications.dto;

import com.moodmate.notifications.entity.NotificationStatus;
import com.moodmate.notifications.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
    Long id,
    NotificationType type,
    String title,
    String body,
    String destinationScreen,
    String destinationParams,
    NotificationStatus status,
    Instant scheduledAt,
    Instant deliveredAt,
    Instant readAt,
    Instant createdAt
) {}
