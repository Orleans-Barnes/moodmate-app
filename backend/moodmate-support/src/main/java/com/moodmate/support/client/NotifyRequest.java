package com.moodmate.support.client;

import java.util.Map;

/** Local copy of moodmate-auth's NotifyRequest shape - the outgoing body for
 * AuthServiceClient.notify(). New for Feature 9 (Notification Deep Linking). */
public record NotifyRequest(Long userId, String title, String body, Map<String, String> data) {
}
