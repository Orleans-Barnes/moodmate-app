package com.moodmate.crisis.client;

import java.util.List;
import java.util.Map;

/** Local copy of moodmate-auth's NotifyRoleRequest shape - the outgoing body for
 * AuthServiceClient.notifyRoles(). New for Feature 9 (Notification Deep Linking). */
public record NotifyRoleRequest(List<String> roles, String title, String body, Map<String, String> data) {
}
