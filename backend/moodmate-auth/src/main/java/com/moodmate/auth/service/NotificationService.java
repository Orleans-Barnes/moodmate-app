package com.moodmate.auth.service;

import com.moodmate.auth.client.ExpoPushClient;
import com.moodmate.auth.client.ExpoPushMessage;
import com.moodmate.auth.dto.NotifyResponse;
import com.moodmate.auth.entity.PushToken;
import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
import com.moodmate.auth.repository.PushTokenRepository;
import com.moodmate.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * New for Feature 9 (Notification Deep Linking) - the actual send-side that PushTokenService's
 * doc comment said didn't exist yet ("nothing in this codebase ever sends a push notification
 * yet... adding actual sends is a separate, explicitly-scoped feature"). This is that feature.
 *
 * Backs two internal endpoints (InternalPushController): notify() for a single user (payment
 * confirmations, counsellor <-> student messages, appointment status changes - all called by
 * their owning service via a local AuthServiceClient) and notifyRoles() for a broadcast (crisis
 * alerts, notifying every ADMIN/COUNSELLOR at once - called by moodmate-crisis).
 *
 * The `data` map every caller supplies is expected to carry a "screen" key - App.tsx's
 * addNotificationResponseReceivedListener reads exactly that key to route a notification tap (see
 * ExpoPushMessage's doc comment). This service does not validate or interpret `screen` itself -
 * it's an opaque pass-through to Expo/the device, same as `title`/`body`.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final PushTokenRepository pushTokenRepository;
    private final UserRepository userRepository;
    private final ExpoPushClient expoPushClient;

    @Transactional(readOnly = true)
    public NotifyResponse notify(Long userId, String title, String body, Map<String, String> data) {
        List<PushToken> tokens = pushTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) {
            return new NotifyResponse(false, 0, "no registered device for this user");
        }
        expoPushClient.send(tokens.stream().map(t -> new ExpoPushMessage(t.getToken(), title, body, data)).toList());
        return new NotifyResponse(true, tokens.size(), null);
    }

    @Transactional(readOnly = true)
    public NotifyResponse notifyRoles(List<Role> roles, String title, String body, Map<String, String> data) {
        List<User> recipients = userRepository.findByRoleIn(roles);
        List<ExpoPushMessage> messages = recipients.stream()
                .flatMap(u -> pushTokenRepository.findByUserId(u.getId()).stream())
                .map(t -> new ExpoPushMessage(t.getToken(), title, body, data))
                .toList();
        if (messages.isEmpty()) {
            return new NotifyResponse(false, 0, "no registered device for any user in " + roles);
        }
        expoPushClient.send(messages);
        return new NotifyResponse(true, messages.size(), null);
    }
}
