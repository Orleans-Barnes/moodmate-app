package com.moodmate.ai.client;

import com.moodmate.ai.config.GroqProperties;
import com.moodmate.ai.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Thin wrapper around Groq's OpenAI-compatible chat completions endpoint
 * (POST {baseUrl}/chat/completions, Authorization: Bearer {apiKey}). Used both for real-time chat
 * replies (AiChatService) and for generating the narrative summary text in GET /api/insights
 * (InsightsService) - same underlying call, different prompt/temperature per caller.
 */
@Component
@RequiredArgsConstructor
public class GroqClient {

    private final GroqProperties properties;

    public String complete(List<GroqMessage> messages, double temperature, int maxTokens) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            // Fails fast with a clear message instead of letting Groq return a generic 401 that
            // would be confusing to debug ("did I set the env var? typo the header? wrong key?").
            throw new ApiException(
                    "AI chat is not configured - GROQ_API_KEY is not set on moodmate-ai.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        GroqChatRequest request = new GroqChatRequest(properties.model(), messages, temperature, maxTokens);
        try {
            GroqChatResponse response = restClient().post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(GroqChatResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()
                    || response.choices().get(0).message() == null) {
                throw new ApiException("Groq returned an empty response", HttpStatus.BAD_GATEWAY);
            }
            return response.choices().get(0).message().content();
        } catch (RestClientException e) {
            throw new ApiException("Could not reach Groq: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    // Feature 15 (Production Hardening) - Timeout Handling. LLM completions genuinely take longer
    // than a typical API call, so this gets a much longer read timeout than the other clients -
    // still bounded rather than infinite, so a stalled Groq request can't hang a chat request or
    // an /api/insights call forever.
    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 30000;

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.baseUrl()).requestFactory(factory).build();
    }
}
