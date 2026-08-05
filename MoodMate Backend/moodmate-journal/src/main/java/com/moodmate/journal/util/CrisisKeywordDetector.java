package com.moodmate.journal.util;

import com.moodmate.journal.client.CrisisSeverity;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Pure, dependency-free keyword matcher run against a journal entry's body before it's saved. Kept
 * deliberately identical to moodmate-ai's copy of this same class (same two keyword tiers, same
 * "not a clinical tool, broad on purpose" reasoning - see that copy's doc comment for the full
 * explanation), so a journal entry and an AI chat message are held to the same detection bar.
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
     * over HIGH if an entry happens to contain both tiers. */
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
