package com.moodmate.ai.util;

import com.moodmate.ai.client.CrisisSeverity;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Pure, dependency-free keyword matcher run against a user's own chat message (never the AI's
 * reply) before it's sent to Groq. This is a deliberately simple, case-insensitive substring
 * heuristic - NOT a clinical screening tool and not a substitute for one. It exists to make sure a
 * human counsellor sees concerning messages, not to make any determination about a student's
 * actual risk level. False positives (a phrase used casually) are an accepted trade-off for this
 * kind of safety net; false negatives (missed real distress) are the far worse failure mode, so
 * the keyword lists below are intentionally broad rather than narrow.
 *
 * CRITICAL = explicit statements of suicidal intent or self-harm intent.
 * HIGH = language strongly associated with crisis (hopelessness, "can't go on") without an
 * explicit self-harm statement - still worth a counsellor's attention, one tier down in urgency.
 *
 * Kept identical (by design, not accident) to moodmate-journal's copy of this same class, so a
 * journal entry and a chat message are held to the same detection bar - see that service's own
 * CrisisKeywordDetector for the duplicate.
 */
public final class CrisisKeywordDetector {

    private CrisisKeywordDetector() {
    }

    private static final List<String> CRITICAL_KEYWORDS = List.of(
            "kill myself", "killing myself", "end my life", "ending my life", "want to die",
            "wish i was dead", "wish i were dead", "better off dead", "no reason to live",
            "no reason to keep living", "take my own life", "taking my own life",
            "ending it all", "suicide", "suicidal", "self-harm", "self harm", "cutting myself",
            "hurt myself", "hurting myself"
    );

    private static final List<String> HIGH_KEYWORDS = List.of(
            "can't go on", "cant go on", "can't take it anymore", "cant take it anymore",
            "no point in living", "give up on life", "giving up on everything",
            "hopeless", "worthless", "nothing matters anymore", "no way out"
    );

    public record Detection(CrisisSeverity severity, List<String> matchedKeywords) {
    }

    /** Returns null if no keywords matched (the common case). CRITICAL is checked first and wins
     * over HIGH if a message happens to contain both tiers. */
    public static Detection detect(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String lower = text.toLowerCase(Locale.ROOT);

        List<String> criticalMatches = matches(lower, CRITICAL_KEYWORDS);
        if (!criticalMatches.isEmpty()) {
            return new Detection(CrisisSeverity.CRITICAL, criticalMatches);
        }

        List<String> highMatches = matches(lower, HIGH_KEYWORDS);
        if (!highMatches.isEmpty()) {
            return new Detection(CrisisSeverity.HIGH, highMatches);
        }

        return null;
    }

    private static List<String> matches(String lowerText, List<String> keywords) {
        List<String> found = new ArrayList<>();
        for (String keyword : keywords) {
            if (lowerText.contains(keyword)) {
                found.add(keyword);
            }
        }
        return found;
    }
}
