package com.moodmate.notifications.mapper;

import com.moodmate.notifications.dto.NotificationResponse;
import com.moodmate.notifications.entity.Notification;

public final class NotificationMapper {

    private NotificationMapper() {}

    public static NotificationResponse toDto(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getBody(),
                n.getDestinationScreen(),
                n.getDestinationParams(),
                n.getStatus(),
                n.getScheduledAt(),
                n.getDeliveredAt(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
