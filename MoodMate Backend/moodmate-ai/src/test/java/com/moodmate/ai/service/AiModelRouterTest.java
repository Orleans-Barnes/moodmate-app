package com.moodmate.ai.service;

import com.moodmate.ai.client.GeminiClient;
import com.moodmate.ai.client.GroqClient;
import com.moodmate.ai.client.GroqMessage;
import com.moodmate.ai.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/** Covers the two behaviors AiModelRouter exists for: automatic failover when the default/
 * preferred model fails, and Pro-only preferredModel ordering (the Pro-status check itself is
 * AiChatService's job, not the router's - the router just trusts whatever preference it's given). */
class AiModelRouterTest {

    private GroqClient groqClient;
    private GeminiClient geminiClient;
    private AiModelRouter router;
    private static final List<GroqMessage> MESSAGES = List.of(new GroqMessage("user", "hi"));

    @BeforeEach
    void setUp() {
        groqClient = mock(GroqClient.class);
        geminiClient = mock(GeminiClient.class);
        router = new AiModelRouter(groqClient, geminiClient);
    }

    @Test
    void defaultOrderUsesGroqFirstAndNeverTouchesGeminiWhenGroqSucceeds() {
        when(groqClient.complete(any(), anyDouble(), anyInt())).thenReturn("groq reply");

        String result = router.complete(MESSAGES, 0.7, 400);

        assertEquals("groq reply", result);
        verifyNoInteractions(geminiClient);
    }

    @Test
    void defaultOrderFailsOverToGeminiWhenGroqThrows() {
        when(groqClient.complete(any(), anyDouble(), anyInt()))
                .thenThrow(new ApiException("Groq down", HttpStatus.BAD_GATEWAY));
        when(geminiClient.complete(any(), anyDouble(), anyInt())).thenReturn("gemini reply");

        String result = router.complete(MESSAGES, 0.7, 400);

        assertEquals("gemini reply", result);
        verify(groqClient).complete(any(), anyDouble(), anyInt());
        verify(geminiClient).complete(any(), anyDouble(), anyInt());
    }

    @Test
    void throwsAClearApiExceptionWhenBothModelsFail() {
        when(groqClient.complete(any(), anyDouble(), anyInt()))
                .thenThrow(new ApiException("Groq down", HttpStatus.BAD_GATEWAY));
        when(geminiClient.complete(any(), anyDouble(), anyInt()))
                .thenThrow(new ApiException("Gemini down", HttpStatus.BAD_GATEWAY));

        ApiException ex = assertThrows(ApiException.class, () -> router.complete(MESSAGES, 0.7, 400));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
    }

    @Test
    void preferredModelGeminiIsTriedFirst() {
        when(geminiClient.complete(any(), anyDouble(), anyInt())).thenReturn("gemini reply");

        String result = router.complete(MESSAGES, 0.7, 400, "gemini");

        assertEquals("gemini reply", result);
        verifyNoInteractions(groqClient);
    }

    @Test
    void preferredModelGeminiStillFailsOverToGroqIfGeminiFails() {
        when(geminiClient.complete(any(), anyDouble(), anyInt()))
                .thenThrow(new ApiException("Gemini down", HttpStatus.BAD_GATEWAY));
        when(groqClient.complete(any(), anyDouble(), anyInt())).thenReturn("groq reply");

        String result = router.complete(MESSAGES, 0.7, 400, "gemini");

        assertEquals("groq reply", result);
    }

    @Test
    void unrecognizedPreferenceFallsBackToDefaultGroqFirstOrder() {
        when(groqClient.complete(any(), anyDouble(), anyInt())).thenReturn("groq reply");

        String result = router.complete(MESSAGES, 0.7, 400, "not-a-real-model");

        assertEquals("groq reply", result);
        verifyNoInteractions(geminiClient);
    }
}
