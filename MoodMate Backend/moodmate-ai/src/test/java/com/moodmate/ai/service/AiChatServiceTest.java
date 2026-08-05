package com.moodmate.ai.service;

import com.moodmate.ai.client.CrisisServiceClient;
import com.moodmate.ai.client.PaymentsServiceClient;
import com.moodmate.ai.config.AiSafetyProperties;
import com.moodmate.ai.config.AiUsageProperties;
import com.moodmate.ai.config.GroqProperties;
import com.moodmate.ai.dto.AiChatRequest;
import com.moodmate.ai.entity.AiChatMessage;
import com.moodmate.ai.entity.ChatRole;
import com.moodmate.ai.exception.ApiException;
import com.moodmate.ai.repository.AiChatMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Covers Premium Enforcement's free-tier daily message cap (Feature 3) and Feature 11's Abuse
 * Protection guards (message-length cap, duplicate-spam guard), plus the Pro-only model-preference
 * gate added alongside AiModelRouter (dual-model routing). AiModelRouter/crisis calls are mocked
 * out entirely here - AiModelRouter's own failover behavior is covered by AiModelRouterTest, not
 * re-tested through AiChatService. */
class AiChatServiceTest {

    private AiChatMessageRepository repository;
    private AiModelRouter aiModelRouter;
    private CrisisServiceClient crisisServiceClient;
    private PaymentsServiceClient paymentsServiceClient;
    private AiChatService service;

    @BeforeEach
    void setUp() {
        repository = mock(AiChatMessageRepository.class);
        aiModelRouter = mock(AiModelRouter.class);
        crisisServiceClient = mock(CrisisServiceClient.class);
        paymentsServiceClient = mock(PaymentsServiceClient.class);
        GroqProperties groqProperties = new GroqProperties("key", "http://localhost", "model", "whisper-large-v3", 20);
        AiUsageProperties aiUsageProperties = new AiUsageProperties(10);
        AiSafetyProperties aiSafetyProperties = new AiSafetyProperties("disclaimer text", 1, 2000, 10);

        service = new AiChatService(repository, aiModelRouter, groqProperties, crisisServiceClient,
                paymentsServiceClient, aiUsageProperties, aiSafetyProperties);

        when(repository.save(any(AiChatMessage.class))).thenAnswer(inv -> {
            AiChatMessage m = inv.getArgument(0);
            m.setId(1L);
            if (m.getCreatedAt() == null) m.setCreatedAt(Instant.now());
            return m;
        });
        when(repository.findTopByUserIdAndRoleOrderByCreatedAtDesc(anyLong(), eq(ChatRole.USER)))
                .thenReturn(Optional.empty());
    }

    @Test
    void freeUserOverDailyCapIsRejectedBeforeAnyModelCall() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(false);
        when(repository.countByUserIdAndRoleAndCreatedAtGreaterThanEqual(eq(1L), eq(ChatRole.USER), any()))
                .thenReturn(10L); // already at the limit

        ApiException ex = assertThrows(ApiException.class,
                () -> service.sendMessage(1L, new AiChatRequest("hello", null, null, null, null)));

        assertEquals(HttpStatus.PAYMENT_REQUIRED, ex.getStatus());
        verifyNoInteractions(aiModelRouter);
        verify(repository, never()).save(any());
    }

    @Test
    void freeUserUnderDailyCapProceedsNormally() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(false);
        when(repository.countByUserIdAndRoleAndCreatedAtGreaterThanEqual(eq(1L), eq(ChatRole.USER), any()))
                .thenReturn(3L);
        when(repository.findByUserIdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of());
        when(aiModelRouter.complete(any(), any(Double.class), any(Integer.class), any()))
                .thenReturn("a supportive reply");

        var response = service.sendMessage(1L, new AiChatRequest("hello", null, null, null, null));

        assertEquals("a supportive reply", response.reply());
        verify(aiModelRouter, times(1)).complete(any(), any(Double.class), any(Integer.class), any());
    }

    @Test
    void proUserBypassesCapEntirely() {
        when(paymentsServiceClient.isPro(2L)).thenReturn(true);
        when(repository.findByUserIdOrderByCreatedAtDesc(eq(2L), any())).thenReturn(List.of());
        when(aiModelRouter.complete(any(), any(Double.class), any(Integer.class), any())).thenReturn("reply");

        service.sendMessage(2L, new AiChatRequest("hello", null, null, null, null));

        verify(repository, never()).countByUserIdAndRoleAndCreatedAtGreaterThanEqual(anyLong(), any(), any());
    }

    @Test
    void oversizedMessageIsRejectedBeforeAnyModelCallOrPersistence() {
        String tooLong = "x".repeat(2001); // AiSafetyProperties in setUp() uses a 2000-char limit

        ApiException ex = assertThrows(ApiException.class,
                () -> service.sendMessage(1L, new AiChatRequest(tooLong, null, null, null, null)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verifyNoInteractions(aiModelRouter);
        verify(repository, never()).save(any());
    }

    @Test
    void exactRepeatWithinTheDuplicateWindowIsRejected() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(true);
        AiChatMessage lastMessage = AiChatMessage.builder().id(5L).userId(1L).role(ChatRole.USER)
                .content("hello").createdAt(Instant.now()).build();
        when(repository.findTopByUserIdAndRoleOrderByCreatedAtDesc(1L, ChatRole.USER))
                .thenReturn(Optional.of(lastMessage));

        ApiException ex = assertThrows(ApiException.class,
                () -> service.sendMessage(1L, new AiChatRequest("hello", null, null, null, null)));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        verifyNoInteractions(aiModelRouter);
    }

    @Test
    void repeatMessageOutsideTheDuplicateWindowIsAllowed() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(true);
        AiChatMessage lastMessage = AiChatMessage.builder().id(5L).userId(1L).role(ChatRole.USER)
                .content("hello").createdAt(Instant.now().minusSeconds(30)).build(); // outside the 10s window
        when(repository.findTopByUserIdAndRoleOrderByCreatedAtDesc(1L, ChatRole.USER))
                .thenReturn(Optional.of(lastMessage));
        when(repository.findByUserIdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of());
        when(aiModelRouter.complete(any(), any(Double.class), any(Integer.class), any())).thenReturn("reply");

        assertDoesNotThrow(() -> service.sendMessage(1L, new AiChatRequest("hello", null, null, null, null)));
    }

    @Test
    void differentMessageWithinTheDuplicateWindowIsAllowed() {
        when(paymentsServiceClient.isPro(1L)).thenReturn(true);
        AiChatMessage lastMessage = AiChatMessage.builder().id(5L).userId(1L).role(ChatRole.USER)
                .content("hello").createdAt(Instant.now()).build();
        when(repository.findTopByUserIdAndRoleOrderByCreatedAtDesc(1L, ChatRole.USER))
                .thenReturn(Optional.of(lastMessage));
        when(repository.findByUserIdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of());
        when(aiModelRouter.complete(any(), any(Double.class), any(Integer.class), any())).thenReturn("reply");

        assertDoesNotThrow(() -> service.sendMessage(1L, new AiChatRequest("a completely different message", null, null, null, null)));
    }

    @Test
    void proUserPreferredModelIsPassedThroughToRouter() {
        when(paymentsServiceClient.isPro(2L)).thenReturn(true);
        when(repository.findByUserIdOrderByCreatedAtDesc(eq(2L), any())).thenReturn(List.of());
        when(aiModelRouter.complete(any(), any(Double.class), any(Integer.class), eq("gemini")))
                .thenReturn("reply from gemini");

        var response = service.sendMessage(2L, new AiChatRequest("hello", null, null, null, "gemini"));

        assertEquals("reply from gemini", response.reply());
        verify(aiModelRouter).complete(any(), any(Double.class), any(Integer.class), eq("gemini"));
    }

    @Test
    void freeUserPreferredModelIsIgnoredNotPassedToRouter() {
        // Free-tier daily cap is disabled in setUp()'s AiUsageProperties(10) only when usedToday
        // stays under 10 - use a fresh low count so this reaches the router call at all.
        when(paymentsServiceClient.isPro(1L)).thenReturn(false);
        when(repository.countByUserIdAndRoleAndCreatedAtGreaterThanEqual(eq(1L), eq(ChatRole.USER), any()))
                .thenReturn(0L);
        when(repository.findByUserIdOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of());
        when(aiModelRouter.complete(any(), any(Double.class), any(Integer.class), eq(null)))
                .thenReturn("reply from default order");

        var response = service.sendMessage(1L, new AiChatRequest("hello", null, null, null, "gemini"));

        assertEquals("reply from default order", response.reply());
        // A free-tier user's preferredModel must never reach the router as anything but null -
        // otherwise a free client could grant itself Pro-only model choice just by sending the field.
        verify(aiModelRouter).complete(any(), any(Double.class), any(Integer.class), eq(null));
    }
}
