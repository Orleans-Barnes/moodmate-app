package com.moodmate.backend.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Thin wrapper around the Groq API.
 *
 * Three capabilities:
 *  1. complete(prompt)                       — single-turn chat (used by Insights)
 *  2. chat(systemPrompt, history, userMsg)   — multi-turn conversation
 *  3. transcribeAudio(audioBytes, filename)  — Whisper audio-to-text
 *  4. completeWithVision(text, base64Image)  — vision model for images
 *
 * The API key is read from the GROQ_API_KEY environment variable — never hardcoded.
 */
@Component
@Slf4j
public class GroqClient {

    private static final String CHAT_PATH    = "/openai/v1/chat/completions";
    private static final String WHISPER_PATH = "/openai/v1/audio/transcriptions";

    private final RestClient http;
    private final String     model;
    private final String     visionModel;
    private final String     whisperModel;

    public GroqClient(
            @Value("${groq.base-url}") String baseUrl,
            @Value("${groq.api-key}")  String apiKey,
            @Value("${groq.model}")    String model,
            @Value("${groq.vision-model:meta-llama/llama-4-scout-17b-16e-instruct}") String visionModel,
            @Value("${groq.whisper-model:whisper-large-v3-turbo}") String whisperModel
    ) {
        this.model        = model;
        this.visionModel  = visionModel;
        this.whisperModel = whisperModel;

        // Warn loudly at startup if the API key is missing or is the placeholder value
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("MISSING_")) {
            log.warn("╔══════════════════════════════════════════════════════════════╗");
            log.warn("║  GROQ_API_KEY is not set — AI features will not work.       ║");
            log.warn("║  Fix (Windows):  set GROQ_API_KEY=gsk_xxx                  ║");
            log.warn("║                  then rerun:  mvnw spring-boot:run          ║");
            log.warn("╚══════════════════════════════════════════════════════════════╝");
        }

        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    // ── 1. Single-turn (used by InsightsService) ─────────────────────────────

    public String complete(String prompt) {
        var body = Map.of(
                "model",           model,
                "messages",        List.of(Map.of("role", "user", "content", prompt)),
                "temperature",     0.7,
                "max_tokens",      500,
                "response_format", Map.of("type", "json_object")
        );
        log.debug("Groq single-turn, model={}", model);
        return callChat(body);
    }

    // ── 2. Multi-turn chat ────────────────────────────────────────────────────

    /**
     * @param systemPrompt  Personality/context instruction for the AI
     * @param history       Prior messages [{role, content}, ...] oldest first
     * @param userMessage   The new user message to send
     */
    public String chat(String systemPrompt,
                       List<Map<String, String>> history,
                       String userMessage) {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        for (Map<String, String> h : history) {
            messages.add(Map.of("role", h.get("role"), "content", h.get("content")));
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        var body = Map.of(
                "model",       model,
                "messages",    messages,
                "temperature", 0.8,
                "max_tokens",  600
        );
        log.debug("Groq multi-turn chat, history={} messages", history.size());
        return callChat(body);
    }

    // ── 3. Vision (image + optional text) ────────────────────────────────────

    public String completeWithVision(String text, String base64Image, String mimeType) {
        // Groq vision uses the same chat completions endpoint but with image_url content type
        var imageUrl = "data:" + mimeType + ";base64," + base64Image;
        var content  = List.of(
                Map.of("type", "text",      "text",      text.isBlank() ? "Describe this image for a wellness context." : text),
                Map.of("type", "image_url", "image_url", Map.of("url", imageUrl))
        );
        var body = Map.of(
                "model",       visionModel,
                "messages",    List.of(Map.of("role", "user", "content", content)),
                "temperature", 0.7,
                "max_tokens",  400
        );
        log.debug("Groq vision call, model={}", visionModel);
        return callChat(body);
    }

    // ── 4. Whisper transcription ──────────────────────────────────────────────

    public String transcribeAudio(byte[] audioBytes, String filename) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new ByteArrayResource(audioBytes) {
            @Override public String getFilename() { return filename; }
        });
        form.add("model",           whisperModel);
        form.add("response_format", "json");

        log.debug("Groq Whisper transcription, model={}, bytes={}", whisperModel, audioBytes.length);

        WhisperResponse resp = http.post()
                .uri(WHISPER_PATH)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(form)
                .retrieve()
                .body(WhisperResponse.class);

        if (resp == null || resp.text() == null || resp.text().isBlank()) {
            throw new RuntimeException("Whisper returned empty transcription");
        }
        return resp.text().trim();
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private String callChat(Object body) {
        GroqResponse response = http.post()
                .uri(CHAT_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(GroqResponse.class);

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new RuntimeException("Groq API returned an empty response");
        }
        return response.choices().get(0).message().content();
    }

    // ── Deserialization records ──────────────────────────────────────────────
    record GroqResponse(List<Choice> choices) {}
    record Choice(Message message) {}
    record Message(String content) {}
    record WhisperResponse(String text) {}
}
