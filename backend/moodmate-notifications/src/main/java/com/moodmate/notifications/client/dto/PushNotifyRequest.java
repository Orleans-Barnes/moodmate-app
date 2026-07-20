package com.moodmate.notifications.client.dto;

import java.util.Map;

/** Mirrors moodmate-auth's dto.NotifyRequest exactly (POST /internal/push/notify) - field names
 * must match for Jackson's record-based deserialization on the receiving end (relies on the
 * -parameters compiler flag already enabled project-wide, same as every other record DTO crossing
 * a service boundary in this codebase). */
public record PushNotifyRequest(Long userId, String title, String body, Map<String, String> data) {
}
