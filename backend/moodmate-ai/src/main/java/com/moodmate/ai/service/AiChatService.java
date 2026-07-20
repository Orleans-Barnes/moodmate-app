package com.moodmate.ai.service;

import com.moodmate.ai.client.CrisisServiceClient;
import com.moodmate.ai.client.GroqMessage;
import com.moodmate.ai.client.PaymentsServiceClient;
import com.moodmate.ai.config.AiSafetyProperties;
import com.moodmate.ai.config.AiUsageProperties;
import com.moodmate.ai.config.GroqProperties;
import com.moodmate.ai.dto.AiChatMessageDto;
import com.moodmate.ai.dto.AiChatRequest;
import com.moodmate.ai.dto.AiChatResponse;
import com.moodmate.ai.entity.AiChatMessage;
import com.moodmate.ai.entity.ChatMessageType;
import com.moodmate.ai.entity.ChatRole;
import com.moodmate.ai.exception.ApiException;
import com.moodmate.ai.repository.AiChatMessageRepository;
import com.moodmate.ai.util.CrisisKeywordDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Text-only for now. The frontend's AiChatRequest also carries audioBase64/imageBase64 fields
 * (voice notes / photos), but no speech-to-text or vision credentials are available in this
 * project (only a Groq text API key was provided - see the credential discussion this feature was
 * scoped from). Rather than silently ignoring an audio/image message and replying to nothing, or
 * pretending to transcribe/analyze it, sendMessage() rejects that case explicitly with a clear
 * error so the frontend can show the user something honest. Wiring real audio/image support later
 * is a matter of adding a transcription/vision call before this method's existing text path, not a
 * redesign.
 *
 * sendMessage() also carries Feature 11's Abuse Protection guards (message-length cap,
 * duplicate-spam guard) and Safety Logging (structured WARN-level log lines for every safety-
 * relevant rejection or trigger), both described inline at each check.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private static final String SYSTEM_PROMPT = """
            You are MoodMate, a warm and supportive AI companion for student mental wellness. \
            You are not a therapist, doctor, or crisis counsellor, and you never provide clinical \
            diagnoses, medication advice, or treatment plans. Be empathetic, encouraging, and \
            practical, and keep replies concise - 2 to 4 sentences, conversational, not a lecture. \
            If a student expresses serious distress, self-harm thoughts, or crisis-level language, \
            respond with warmth first, then gently and clearly encourage them to reach out to a \
            counsellor or the app's SOS/crisis resources right away - do not try to talk them out \
            of those feelings yourself or attempt to handle a crisis on your own.""";

    private final AiChatMessageRepository repository;
    private final AiModelRouter aiModelRouter;
    private final GroqProperties groqProperties;
    private final CrisisServiceClient crisisServiceClient;
    private final PaymentsServiceClient paymentsServiceClient;
    private final AiUsageProperties aiUsageProperties;
    private final AiSafetyProperties aiSafetyProperties;

    @Transactional
    public AiChatResponse sendMessage(Long userId, AiChatRequest request) {
        if (request.message() == null || request.message().isBlank()) {
            if (request.audioBase64() != null || request.imageBase64() != null) {
                throw new ApiException(
                        "Voice and photo messages aren't supported yet - please type your message instead.",
                        HttpStatus.BAD_REQUEST);
            }
            throw new ApiException("Message cannot be empty", HttpStatus.BAD_REQUEST);
        }

        // Feature 11 - Abuse Protection: reject an oversized payload before it ever reaches the
        // premium-cap check, the crisis scanner, or Groq. A generous default (see application.yml)
        // - this exists to stop deliberately huge/spam payloads, not to constrain a normal message.
        if (aiSafetyProperties.maxMessageLength() > 0
                && request.message().trim().length() > aiSafetyProperties.maxMessageLength()) {
            log.warn("Rejected oversized AI chat message from user {} ({} chars, limit {})",
                    userId, request.message().trim().length(), aiSafetyProperties.maxMessageLength());
            throw new ApiException(
                    "Message is too long (max " + aiSafetyProperties.maxMessageLength() + " characters)",
                    HttpStatus.BAD_REQUEST);
        }

        // Premium Enforcement: server-side free-tier daily message cap. Checked BEFORE the crisis
        // scan and BEFORE any Groq call is made, so a capped-out free user never triggers a paid
        // Groq API call. Pro status is verified against wallet-service itself, not trusted from
        // the request - a client can't bypass this by simply not sending a "pro" flag, because
        // there never was one to send.
        if (aiUsageProperties.freeDailyMessageLimit() > 0 && !paymentsServiceClient.isPro(userId)) {
            Instant since = Instant.now().truncatedTo(ChronoUnit.DAYS);
            long usedToday = repository.countByUserIdAndRoleAndCreatedAtGreaterThanEqual(userId, ChatRole.USER, since);
            if (usedToday >= aiUsageProperties.freeDailyMessageLimit()) {
                log.info("User {} hit the free-tier AI chat daily cap ({} messages)", userId,
                        aiUsageProperties.freeDailyMessageLimit());
                throw new ApiException(
                        "You've reached today's free AI chat limit (" + aiUsageProperties.freeDailyMessageLimit()
                                + " messages). Upgrade to MoodMate Pro for unlimited AI Coach conversations.",
                        HttpStatus.PAYMENT_REQUIRED);
            }
        }

        String userText = request.message().trim();

        // Feature 11 - Abuse Protection: reject an exact repeat of the user's own immediately-
        // preceding message if it arrives within a short window - a common spam/flooding pattern
        // this project's per-minute gateway rate limit (Feature 5) doesn't specifically target
        // (that one caps overall request volume, not repeated identical content).
        if (aiSafetyProperties.duplicateMessageWindowSeconds() > 0) {
            repository.findTopByUserIdAndRoleOrderByCreatedAtDesc(userId, ChatRole.USER).ifPresent(last -> {
                boolean withinWindow = last.getCreatedAt().isAfter(
                        Instant.now().minusSeconds(aiSafetyProperties.duplicateMessageWindowSeconds()));
                if (withinWindow && last.getContent().equals(userText)) {
                    log.warn("Rejected duplicate AI chat message from user {} sent within {}s of the previous one",
                            userId, aiSafetyProperties.duplicateMessageWindowSeconds());
                    throw new ApiException(
                            "You're sending the same message repeatedly - please wait a moment before trying again.",
                            HttpStatus.TOO_MANY_REQUESTS);
                }
            });
        }

        // Crisis check runs on the user's own text, BEFORE calling Groq - a slow or failed Groq
        // call must never delay or block this from happening.
        CrisisKeywordDetector.Detection detection = CrisisKeywordDetector.detect(userText);
        if (detection != null) {
            log.warn("Crisis keywords detected for user {} (severity={}, keywords={})",
                    userId, detection.severity(), detection.matchedKeywords());
            crisisServiceClient.raiseAlert(userId, userText, detection.matchedKeywords(), detection.severity());
        }

        repository.save(AiChatMessage.builder()
                .userId(userId)
                .role(ChatRole.USER)
                .content(userText)
                .messageType(ChatMessageType.TEXT)
                .build());

        List<GroqMessage> conversation = buildConversation(userId, userText);
        // Model preference is a Pro-only capability - only pass the client's requested model
        // through to the router if this user is verified Pro (same server-side isPro() check
        // used for the free-tier cap above, not a client-supplied flag - a free client can't
        // grant itself model choice by just sending the field). The isPro() lookup is skipped
        // entirely when no preference was sent (today's frontend never sends one), so this adds
        // no extra network call on the common path - only once a model-picker UI starts sending
        // preferredModel does the extra check kick in, and only for Pro verification of that.
        String preferredModel = null;
        if (request.preferredModel() != null && !request.preferredModel().isBlank()
                && paymentsServiceClient.isPro(userId)) {
            preferredModel = request.preferredModel();
        }
        String reply = aiModelRouter.complete(conversation, 0.7, 400, preferredModel);

        AiChatMessage assistantMessage = repository.save(AiChatMessage.builder()
                .userId(userId)
                .role(ChatRole.ASSISTANT)
                .content(reply)
                .messageType(ChatMessageType.TEXT)
                .build());

        return new AiChatResponse(assistantMessage.getId(), reply, null, assistantMessage.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<AiChatMessageDto> history(Long userId, int size) {
        Pageable pageable = PageRequest.of(0, Math.max(1, size));
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void clearHistory(Long userId) {
        repository.deleteByUserId(userId);
    }

    /** Pulls the last N messages (moodmate.groq.max-history-messages) for conversation context,
     * reverses them back to oldest-first (the repository query is newest-first), prepends the
     * system prompt, and appends the new user message that hasn't been sent to Groq yet. */
    private List<GroqMessage> buildConversation(Long userId, String newUserText) {
        Pageable pageable = PageRequest.of(0, Math.max(0, groqProperties.maxHistoryMessages()));
        List<AiChatMessage> recent = new ArrayList<>(repository.findByUserIdOrderByCreatedAtDesc(userId, pageable));
        Collections.reverse(recent);

        List<GroqMessage> messages = new ArrayList<>();
        messages.add(new GroqMessage("system", SYSTEM_PROMPT));
        for (AiChatMessage m : recent) {
            messages.add(new GroqMessage(m.getRole() == ChatRole.USER ? "user" : "assistant", m.getContent()));
        }
        messages.add(new GroqMessage("user", newUserText));
        return messages;
    }

    private AiChatMessageDto toDto(AiChatMessage m) {
        return new AiChatMessageDto(
                m.getId(),
                m.getRole() == ChatRole.USER ? "user" : "assistant",
                m.getContent(),
                m.getMessageType().name().toLowerCase(),
                m.getCreatedAt());
    }
}
