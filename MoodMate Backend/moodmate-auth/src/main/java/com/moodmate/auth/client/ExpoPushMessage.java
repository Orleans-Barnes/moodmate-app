package com.moodmate.auth.client;

import java.util.Map;

/** Expo's push API wire format (https://docs.expo.dev/push-notifications/sending-notifications/).
 * `to` is the Expo push token (src/api/push.ts registers this exact string via PUT
 * /api/push/token); `data` is delivered to the device and read by App.tsx's
 * addNotificationResponseReceivedListener as `response.notification.request.content.data` - the
 * `screen` key inside it is what that listener actually reads to route the tap. */
public record ExpoPushMessage(String to, String title, String body, Map<String, String> data) {
}
