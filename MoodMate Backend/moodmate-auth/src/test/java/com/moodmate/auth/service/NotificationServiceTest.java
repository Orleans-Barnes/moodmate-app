package com.moodmate.auth.service;

import com.moodmate.auth.client.ExpoPushClient;
import com.moodmate.auth.client.ExpoPushMessage;
import com.moodmate.auth.dto.NotifyResponse;
import com.moodmate.auth.entity.PushToken;
import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
import com.moodmate.auth.repository.PushTokenRepository;
import com.moodmate.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 9's send-side: NotificationService.notify()/notifyRoles(). ExpoPushClient is
 * mocked - actual HTTP delivery to Expo isn't exercised here (that's ExpoPushClient's own concern,
 * a thin fire-and-forget wrapper with no branching logic worth a unit test beyond compilation). */
class NotificationServiceTest {

    private PushTokenRepository pushTokenRepository;
    private UserRepository userRepository;
    private ExpoPushClient expoPushClient;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        pushTokenRepository = mock(PushTokenRepository.class);
        userRepository = mock(UserRepository.class);
        expoPushClient = mock(ExpoPushClient.class);
        service = new NotificationService(pushTokenRepository, userRepository, expoPushClient);
    }

    @Test
    void notifySendsToEveryRegisteredDeviceForThatUser() {
        PushToken token1 = PushToken.builder().userId(1L).token("ExponentPushToken[aaa]").build();
        PushToken token2 = PushToken.builder().userId(1L).token("ExponentPushToken[bbb]").build();
        when(pushTokenRepository.findByUserId(1L)).thenReturn(List.of(token1, token2));

        NotifyResponse response = service.notify(1L, "Payment received", "Your Pro plan is active", Map.of("screen", "Wallet"));

        assertTrue(response.sent());
        assertEquals(2, response.deviceCount());
        verify(expoPushClient).send(eq(List.of(
                new ExpoPushMessage("ExponentPushToken[aaa]", "Payment received", "Your Pro plan is active", Map.of("screen", "Wallet")),
                new ExpoPushMessage("ExponentPushToken[bbb]", "Payment received", "Your Pro plan is active", Map.of("screen", "Wallet")))));
    }

    @Test
    void notifyReportsNoDeviceRatherThanThrowingWhenUserHasNoToken() {
        when(pushTokenRepository.findByUserId(1L)).thenReturn(List.of());

        NotifyResponse response = service.notify(1L, "title", "body", Map.of());

        assertFalse(response.sent());
        assertEquals(0, response.deviceCount());
        assertEquals("no registered device for this user", response.reason());
        verify(expoPushClient, times(0)).send(any());
    }

    @Test
    void notifyRolesFansOutToEveryMatchingUsersDevices() {
        User admin = User.builder().id(1L).email("admin@example.com").fullName("Admin").role(Role.ADMIN).build();
        User counsellor = User.builder().id(2L).email("c@example.com").fullName("Counsellor").role(Role.COUNSELLOR).build();
        when(userRepository.findByRoleIn(List.of(Role.ADMIN, Role.COUNSELLOR))).thenReturn(List.of(admin, counsellor));
        when(pushTokenRepository.findByUserId(1L)).thenReturn(List.of(PushToken.builder().userId(1L).token("t1").build()));
        when(pushTokenRepository.findByUserId(2L)).thenReturn(List.of(PushToken.builder().userId(2L).token("t2").build()));

        NotifyResponse response = service.notifyRoles(List.of(Role.ADMIN, Role.COUNSELLOR),
                "New crisis alert", "A student may need immediate support", Map.of("screen", "CrisisAlerts"));

        assertTrue(response.sent());
        assertEquals(2, response.deviceCount());
    }

    @Test
    void notifyRolesReportsNoDeviceWhenNoMatchingUserHasATokenRegistered() {
        when(userRepository.findByRoleIn(List.of(Role.ADMIN))).thenReturn(List.of());

        NotifyResponse response = service.notifyRoles(List.of(Role.ADMIN), "title", "body", Map.of());

        assertFalse(response.sent());
        verify(expoPushClient, times(0)).send(any());
    }
}
