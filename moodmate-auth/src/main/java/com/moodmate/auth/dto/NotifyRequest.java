package com.moodmate.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

/** Body for POST /internal/push/notify. `data` should carry a "screen" key matching App.tsx's
 * notification-tap routeMap (e.g. "Wallet", "Chat", "CounsellorChat", "Appointments",
 * "CrisisAlerts") plus whatever params that screen needs (conversationId, appointmentId, ...) -
 * see NotificationService's doc comment for the full contract this was built against. */
public record NotifyRequest(@NotNull Long userId, @NotBlank String title, @NotBlank String body,
                             Map<String, String> data) {
}
