package com.moodmate.backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodmate.backend.ai.dto.InsightsResponse;
import com.moodmate.backend.checkin.MoodCheckin;
import com.moodmate.backend.checkin.MoodCheckinRepository;
import com.moodmate.backend.journal.JournalEntry;
import com.moodmate.backend.journal.JournalEntryRepository;
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
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsightsService {

    /** Freemium users may call GET /api/insights this many times per day. */
    static final int FREE_DAILY_LIMIT = 5;

    private final MoodCheckinRepository    moodCheckinRepository;
    private final JournalEntryRepository   journalEntryRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final AiDailyUsageRepository   aiDailyUsageRepository;
    private final GroqClient               groqClient;
    private final ObjectMapper             objectMapper;

    /**
     * Generates an AI insights response for the given user.
     *
     * <p>Premium users (ACTIVE or TRIALING subscription) have unlimited access.
     * Freemium users are capped at {@value #FREE_DAILY_LIMIT} calls per day;
     * exceeding the cap returns HTTP 429 with a clear message.
     */
    @Transactional
    public InsightsResponse generateInsights(Long userId) {
        if (!isPremium(userId)) {
            enforceFreemiumLimit(userId);
        }

        List<MoodCheckin>  checkins = moodCheckinRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 10))
                .getContent();
        List<JournalEntry> journals = journalEntryRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 5))
                .getContent();

        try {
            String rawJson = groqClient.complete(buildPrompt(checkins, journals));
            return parseResponse(rawJson);
        } catch (ResponseStatusException rse) {
            throw rse;   // don't swallow 429s
        } catch (Exception e) {
            log.warn("Groq call failed for userId={}, returning fallback. Reason: {}", userId, e.getMessage());
            return fallback();
        }
    }

    // ── Subscription check ───────────────────────────────────────────────────

    private boolean isPremium(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .map(s -> s.getStatus() == SubscriptionStatus.ACTIVE
                       || s.getStatus() == SubscriptionStatus.TRIALING)
                .orElse(false);
    }

    // ── Freemium daily limit ─────────────────────────────────────────────────

    private void enforceFreemiumLimit(Long userId) {
        LocalDate today = LocalDate.now();
        AiDailyUsage usage = aiDailyUsageRepository
                .findByUserIdAndUsageDate(userId, today)
                .orElse(null);

        if (usage != null && usage.getCallCount() >= FREE_DAILY_LIMIT) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "You've used your " + FREE_DAILY_LIMIT + " free AI insights for today. "
                    + "Upgrade to Premium for unlimited access."
            );
        }

        // Increment or create
        if (usage == null) {
            aiDailyUsageRepository.save(
                AiDailyUsage.builder()
                    .userId(userId)
                    .usageDate(today)
                    .callCount(1)
                    .build()
            );
        } else {
            usage.increment();
            aiDailyUsageRepository.save(usage);
        }
    }

    // ── Prompt builder ───────────────────────────────────────────────────────

    private String buildPrompt(List<MoodCheckin> checkins, List<JournalEntry> journals) {
        StringBuilder sb = new StringBuilder("""
                You are a compassionate mental wellness assistant. \
                Analyse the following user data and respond ONLY with valid JSON \
                containing exactly these four fields — nothing else:
                {
                  "narrativeSummary": "<2-3 warm, encouraging sentences summarising the user's emotional week>",
                  "sentimentScore": <integer -100 (very negative) to 100 (very positive)>,
                  "wellnessScore":  <integer 0 (poor) to 100 (excellent)>,
                  "forecastAlert":  "<short warning if patterns suggest a dip in 48-72 hours, otherwise null>"
                }
                
                Mood check-ins (most recent first):
                """);

        if (checkins.isEmpty()) {
            sb.append("None recorded yet.\n");
        } else {
            for (MoodCheckin c : checkins) {
                sb.append(String.format("- emotion=%s stress=%d energy=%d note=%s%n",
                        c.getEmotionKey(),
                        c.getStressLevel(),
                        c.getEnergyLevel(),
                        c.getNote() != null ? c.getNote() : "—"));
            }
        }

        sb.append("\nJournal entries (most recent first):\n");
        if (journals.isEmpty()) {
            sb.append("None recorded yet.\n");
        } else {
            for (JournalEntry j : journals) {
                String body = j.getBody().length() > 250
                        ? j.getBody().substring(0, 250) + "…"
                        : j.getBody();
                sb.append(String.format("- [%s] %s: %s%n",
                        j.getMoodEmoji() != null ? j.getMoodEmoji() : "",
                        j.getTitle()    != null ? j.getTitle()    : "Untitled",
                        body));
            }
        }

        return sb.toString();
    }

    // ── Response parser ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private InsightsResponse parseResponse(String rawJson) throws Exception {
        Map<String, Object> map = objectMapper.readValue(rawJson, Map.class);
        return new InsightsResponse(
                str(map, "narrativeSummary", "You're on a meaningful journey — keep going."),
                num(map, "sentimentScore",   0),
                num(map, "wellnessScore",    50),
                str(map, "forecastAlert",    null),
                Instant.now()
        );
    }

    private String str(Map<String, Object> m, String key, String def) {
        Object v = m.get(key);
        if (v == null || "null".equalsIgnoreCase(v.toString().trim())) return def;
        return v.toString();
    }

    private int num(Map<String, Object> m, String key, int def) {
        try {
            Object v = m.get(key);
            return v == null ? def : ((Number) v).intValue();
        } catch (Exception e) {
            return def;
        }
    }

    private InsightsResponse fallback() {
        return new InsightsResponse(
                "We couldn't load your insights right now. Keep checking in — your data is building a meaningful picture.",
                0, 50, null, Instant.now()
        );
    }
}
