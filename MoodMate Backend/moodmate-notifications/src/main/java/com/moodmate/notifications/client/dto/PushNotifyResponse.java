package com.moodmate.notifications.client.dto;

/** Mirrors moodmate-auth's dto.NotifyResponse exactly. sent=false with a reason (e.g. "no
 * registered device") is a normal, expected outcome, not an error. */
public record PushNotifyResponse(boolean sent, int deviceCount, String reason) {
}
