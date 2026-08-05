package com.moodmate.ai.service;

import com.moodmate.ai.client.GeminiClient;
import com.moodmate.ai.client.GroqClient;
import com.moodmate.ai.client.GroqMessage;
import com.moodmate.ai.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Supplier;

/**
 * Dual-model routing between Groq (default primary) and Gemini (default secondary) chat
 * completion providers. Both AiChatService and InsightsService call this instead of GroqClient
 * directly - neither needs to know a second provider exists.
 *
 * Two independent behaviors, both driven from the same two clients:
 *
 *  - Automatic failover (every caller, every user): the primary model is tried first; if it
 *    throws (timeout, 5xx, missing API key, empty response - anything GroqClient/GeminiClient
 *    surfaces as a RuntimeException), the OTHER model is tried once before giving up. This is
 *    what fixes the class of outage this feature was built for - a single misconfigured or
 *    down provider no longer takes out AI chat or /api/insights entirely.
 *
 *  - Explicit model preference (Pro users only - enforced by the CALLER, not here, since only
 *    AiChatService knows a given request's Pro status): pass preferredModel ("groq" | "gemini")
 *    to try that model first instead of the default primary. The other model is still used as
 *    the failover target either way. A null/unrecognized preference (including every non-Pro
 *    call site) falls through to the default Groq-first order.
 *
 * If BOTH calls fail, the primary's failure is logged at WARN (expected/handled) and the
 * secondary's failure at ERROR (both providers down is the real incident) - then a single clear
 * ApiException is thrown so callers don't need to know there were two attempts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiModelRouter {

    private final GroqClient groqClient;
    private final GeminiClient geminiClient;

    public String complete(List<GroqMessage> messages, double temperature, int maxTokens) {
        return complete(messages, temperature, maxTokens, null);
    }

    public String complete(List<GroqMessage> messages, double temperature, int maxTokens, String preferredModel) {
        boolean geminiFirst = "gemini".equalsIgnoreCase(preferredModel);

        String firstName = geminiFirst ? "Gemini" : "Groq";
        String secondName = geminiFirst ? "Groq" : "Gemini";
        Supplier<String> firstCall = geminiFirst
                ? () -> geminiClient.complete(messages, temperature, maxTokens)
                : () -> groqClient.complete(messages, temperature, maxTokens);
        Supplier<String> secondCall = geminiFirst
                ? () -> groqClient.complete(messages, temperature, maxTokens)
                : () -> geminiClient.complete(messages, temperature, maxTokens);

        try {
            return firstCall.get();
        } catch (RuntimeException primaryFailure) {
            log.warn("{} call failed, failing over to {}: {}", firstName, secondName, primaryFailure.getMessage());
            try {
                return secondCall.get();
            } catch (RuntimeException secondaryFailure) {
                log.error("{} fallback also failed after {} failure", secondName, firstName, secondaryFailure);
                throw new ApiException(
                        "AI chat is temporarily unavailable - both configured models failed to respond. Please try again shortly.",
                        HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    }
}
