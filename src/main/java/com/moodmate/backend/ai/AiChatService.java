package com.moodmate.backend.ai;

import com.moodmate.backend.ai.dto.AiChatRequest;
import com.moodmate.backend.ai.dto.AiChatResponse;
import com.moodmate.backend.crisis.CrisisAlertService;
import com.moodmate.backend.crisis.CrisisSource;
import com.moodmate.backend.payments.SubscriptionStatus;
import com.moodmate.backend.payments.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    static final int FREE_CHAT_DAILY_LIMIT = 20;

    /** Number of prior messages included in each Groq request for context. */
    private static final int CONTEXT_WINDOW = 20;

    private static final String SYSTEM_PROMPT = """
            You are MoodMate AI, a warm and compassionate mental wellness companion for university students.

            Your role:
            - Listen actively and validate feelings without judgment
            - Offer evidence-based coping strategies (CBT techniques, mindfulness, grounding, behavioural activation)
            - Guide students toward insight and healthy habits — do NOT diagnose, prescribe, or replace professional care
            - Be empathetic, encouraging, and concise (2–4 sentences per reply unless the student asks for more)
            - Use plain, conversational language — never clinical jargon or robotic phrasing

            If a student expresses thoughts of self-harm, suicide, or severe distress:
            - Respond with calm, non-judgmental empathy first
            - Gently but clearly encourage them to use the SOS feature in the app or contact a crisis line
            - Do NOT provide methods, risk assessments, or make promises about outcomes
            - Phrase it as: "It sounds like you're going through something really painful right now. Please reach out to the SOS button in MoodMate or contact a crisis line — you deserve real support."

            Therapeutic techniques you may draw from (always explain briefly before suggesting):
            - Grounding: 5-4-3-2-1 senses technique
            - Breathing: diaphragmatic breathing (4 in, 3 hold, 5 out)
            - Cognitive reframing: gently question unhelpful thought patterns
            - Behavioural activation: small, achievable activities to lift mood
            - Sleep hygiene, exercise, social connection as lifestyle anchors

            Input formats: Voice transcriptions are labelled "🎙️ Voice:" and image context "🖼️ Image:" — respond naturally to both.
            """;

    private final AiChatMessageRepository    chatRepository;
    private final AiDailyUsageRepository     usageRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final GroqClient                 groqClient;
    private final CrisisAlertService         crisisAlertService;

    // ── Send a message ────────────────────────────────────────────────────────

    @Transactional
    public AiChatResponse chat(Long userId, AiChatRequest request) {
        if (!isPremium(userId)) {
            enforceLimit(userId);
        }

        String transcribedText = null;
        String userContent;
        String messageType;

        if (request.audioBase64() != null && !request.audioBase64().isBlank()) {
            // ── Voice note ──────────────────────────────────────────────────
            messageType = "audio";
            byte[] audioBytes = Base64.getDecoder().decode(request.audioBase64());
            String filename = request.audioFilename() != null ? request.audioFilename() : "voice.m4a";
            try {
                transcribedText = groqClient.transcribeAudio(audioBytes, filename);
                userContent = "🎙️ Voice: " + transcribedText;
            } catch (Exception e) {
                log.warn("Whisper transcription failed for userId={}: {}", userId, e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Could not transcribe your voice note. Please try again.");
            }

        } else if (request.imageBase64() != null && !request.imageBase64().isBlank()) {
            // ── Image ───────────────────────────────────────────────────────
            messageType = "image";
            String caption = request.message() != null ? request.message().trim() : "";
            try {
                String description = groqClient.completeWithVision(
                        caption.isEmpty() ? "Describe what you see in this image." : caption,
                        request.imageBase64(),
                        "image/jpeg"
                );
                userContent = "🖼️ Image: " + (caption.isEmpty() ? "(no caption)" : caption)
                            + "\n[AI saw: " + description + "]";
            } catch (Exception e) {
                log.warn("Vision call failed for userId={}: {}", userId, e.getMessage());
                // Fall back: treat caption as plain text
                userContent = caption.isEmpty() ? "🖼️ (Shared an image)" : "🖼️ " + caption;
            }

        } else {
            // ── Plain text ───────────────────────────────────────────────────
            messageType = "text";
            if (request.message() == null || request.message().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be empty.");
            }
            userContent = request.message().trim();
        }

        // Save user message
        AiChatMessage userMsg = chatRepository.save(AiChatMessage.builder()
                .userId(userId)
                .role("user")
                .content(userContent)
                .messageType(messageType)
                .build());

        // ── Crisis detection — scan the raw user text before sending to Groq ──
        // Uses the original request text (not the 🎙️/🖼️ labelled version) for cleaner matching.
        String textToScan = request.message() != null ? request.message()
                : (transcribedText != null ? transcribedText : userContent);
        crisisAlertService.analyseAndFlag(userId, textToScan, CrisisSource.AI_CHAT);

        // Build context from recent history (excluding the message we just saved)
        List<Map<String, String>> history = chatRepository
                .findByUserIdOrderByCreatedAtAsc(userId, PageRequest.of(0, CONTEXT_WINDOW + 1))
                .stream()
                .filter(m -> !m.getId().equals(userMsg.getId()))
                .limit(CONTEXT_WINDOW)
                .map(m -> Map.of("role", m.getRole(), "content", m.getContent()))
                .collect(Collectors.toList());

        // Call Groq
        String reply;
        try {
            reply = groqClient.chat(SYSTEM_PROMPT, history, userContent);
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("Groq chat failed for userId={}: {}", userId, e.getMessage());
            reply = "I'm having a moment of trouble connecting. Please try again shortly — I'm here for you.";
        }

        // Save assistant reply
        AiChatMessage assistantMsg = chatRepository.save(AiChatMessage.builder()
                .userId(userId)
                .role("assistant")
                .content(reply)
                .messageType("text")
                .build());

        return new AiChatResponse(assistantMsg.getId(), reply, transcribedText, assistantMsg.getCreatedAt());
    }

    // ── Clear history ─────────────────────────────────────────────────────────

    @Transactional
    public void clearHistory(Long userId) {
        chatRepository.deleteAllByUserId(userId);
    }

    // ── Subscription check ────────────────────────────────────────────────────

    private boolean isPremium(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .map(s -> s.getStatus() == SubscriptionStatus.ACTIVE
                       || s.getStatus() == SubscriptionStatus.TRIALING)
                .orElse(false);
    }

    // ── Freemium daily limit ──────────────────────────────────────────────────

    private void enforceLimit(Long userId) {
        LocalDate today = LocalDate.now();
        AiDailyUsage usage = usageRepository.findByUserIdAndUsageDate(userId, today).orElse(null);

        if (usage != null && usage.getChatCallCount() >= FREE_CHAT_DAILY_LIMIT) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "You've used your " + FREE_CHAT_DAILY_LIMIT
                    + " free AI chat messages for today. Upgrade to Premium for unlimited access.");
        }

        if (usage == null) {
            usageRepository.save(AiDailyUsage.builder()
                    .userId(userId)
                    .usageDate(today)
                    .callCount(0)      // insights counter stays 0
                    .chatCallCount(1)
                    .build());
        } else {
            usage.incrementChat();
            usageRepository.save(usage);
        }
    }
}
