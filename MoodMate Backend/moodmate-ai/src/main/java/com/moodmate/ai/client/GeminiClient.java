package com.moodmate.ai.client;

import com.moodmate.ai.config.GeminiProperties;
import com.moodmate.ai.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;

/**
 * Thin wrapper around Gemini's generateContent endpoint
 * (POST {baseUrl}/models/{model}:generateContent?key={apiKey}) - the secondary/fallback model
 * behind AiModelRouter, mirroring GroqClient's role and shape exactly so the router can treat both
 * providers identically.
 *
 * Reuses GroqMessage as the common message shape (role "system"|"user"|"assistant") rather than
 * introducing a second message type the callers would need to build - this client does the
 * translation to Gemini's own contents/systemInstruction shape internally. Gemini's role
 * vocabulary is "user"|"model" (not "assistant"), and it has no in-list "system" role - a system
 * prompt is a separate top-level systemInstruction field. The first "system" message found (if
 * any) is pulled out for that; everything else is mapped role-for-role ("assistant" -> "model").
 */
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final GeminiProperties properties;

    public String complete(List<GroqMessage> messages, double temperature, int maxTokens) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            // Same fail-fast contract as GroqClient - a clear, immediate error instead of a
            // confusing 400/401 from Gemini itself.
            throw new ApiException(
                    "Gemini is not configured - GEMINI_API_KEY is not set on moodmate-ai.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        String systemText = null;
        List<GeminiContent> contents = new ArrayList<>();
        for (GroqMessage m : messages) {
            if ("system".equals(m.role())) {
                if (systemText == null) {
                    systemText = m.content();
                }
                continue;
            }
            String geminiRole = "assistant".equals(m.role()) ? "model" : "user";
            contents.add(new GeminiContent(geminiRole, List.of(new GeminiPart(m.content()))));
        }

        GeminiRequest request = new GeminiRequest(
                systemText != null ? new GeminiSystemInstruction(List.of(new GeminiPart(systemText))) : null,
                contents,
                new GeminiGenerationConfig(temperature, maxTokens));

        try {
            GeminiResponse response = restClient().post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/{model}:generateContent")
                            .queryParam("key", properties.apiKey())
                            .build(properties.model()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(GeminiResponse.class);

            if (response == null || response.candidates() == null || response.candidates().isEmpty()
                    || response.candidates().get(0).content() == null
                    || response.candidates().get(0).content().parts() == null
                    || response.candidates().get(0).content().parts().isEmpty()) {
                throw new ApiException("Gemini returned an empty response", HttpStatus.BAD_GATEWAY);
            }
            return response.candidates().get(0).content().parts().get(0).text();
        } catch (RestClientException e) {
            throw new ApiException("Could not reach Gemini: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    // Same bounded-timeout reasoning as GroqClient - LLM completions take longer than a typical
    // API call, but must still be bounded so a stalled Gemini request can't hang a request forever.
    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 30000;

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.baseUrl()).requestFactory(factory).build();
    }
}
