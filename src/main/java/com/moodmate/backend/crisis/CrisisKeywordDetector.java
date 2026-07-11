package com.moodmate.backend.crisis;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Detects crisis language in free-text input using a two-tier phrase list.
 *
 * Design principles (from Crisis Text Line / Safe Messaging Guidelines):
 *  - Phrase matching rather than single words avoids common false positives
 *    (e.g. "kill" alone fires on "kill it in the exam").
 *  - Negation contexts ("I don't want to die" vs "I want to die") are partially
 *    handled via separate safe-phrase exclusions.
 *  - Two severity tiers: CRITICAL (act immediately) and HIGH (review within 24h).
 */
@Component
public class CrisisKeywordDetector {

    /** Phrases that almost unambiguously indicate imminent self-harm / suicide. */
    private static final List<String> CRITICAL_PHRASES = List.of(
        "suicide", "suicidal",
        "kill myself", "killing myself",
        "end my life", "ending my life",
        "take my life", "taking my life",
        "want to die", "wanna die", "i want to die", "i wanna die",
        "i'm going to die", "going to kill myself", "gonna kill myself",
        "self harm", "self-harm", "selfharm",
        "cutting myself", "cut myself", "cutting my wrist",
        "hurt myself", "hurting myself",
        "better off dead", "better off without me",
        "no reason to live", "no point living", "no point in living",
        "can't live anymore", "can't live like this",
        "don't want to live", "don't wanna live",
        "rather be dead",
        "end it all", "end it",
        "plan to die", "planning to die",
        "overdose", "od myself", "od on",
        "hang myself", "hanging myself",
        "jump off", "jumping off"
    );

    /** Elevated risk — serious concern but may need context; counsellor review required. */
    private static final List<String> HIGH_PHRASES = List.of(
        "worthless", "i'm worthless", "i am worthless",
        "hopeless", "i'm hopeless", "i am hopeless", "feel hopeless",
        "nobody cares", "no one cares about me", "nobody cares about me",
        "i'm a burden", "i am a burden", "feel like a burden",
        "nobody would miss me", "no one would miss me",
        "can't go on", "cannot go on",
        "can't take it anymore", "cannot take it anymore",
        "want to disappear", "wanna disappear", "wish i would disappear",
        "i give up", "i've given up",
        "i hate myself",
        "harming myself",
        "want to hurt", "want to kill", // targeting others — duty to warn
        "going to hurt someone", "going to hurt them"
    );

    /**
     * Phrases that cancel out a match — e.g. "I don't want to die" is safer
     * than "I want to die". Very basic negation handling.
     */
    private static final List<String> NEGATION_PREFIXES = List.of(
        "don't ", "do not ", "doesn't ", "does not ", "didn't ", "did not ",
        "never ", "not ", "no longer ", "i used to ", "used to ",
        "i'm not ", "i am not ", "was ", "were ", "had ", "have never "
    );

    public record DetectionResult(
            boolean detected,
            CrisisSeverity severity,
            List<String> matchedPhrases
    ) {}

    /**
     * Analyse {@code text} for crisis signals.
     *
     * @param text raw message or journal text
     * @return detection result; {@code detected == false} if nothing found
     */
    public DetectionResult analyse(String text) {
        if (text == null || text.isBlank()) {
            return new DetectionResult(false, null, List.of());
        }

        String lower = text.toLowerCase(Locale.ROOT);
        List<String> matched = new ArrayList<>();

        // Check CRITICAL tier first
        for (String phrase : CRITICAL_PHRASES) {
            if (lower.contains(phrase) && !isNegated(lower, phrase)) {
                matched.add(phrase);
            }
        }
        if (!matched.isEmpty()) {
            return new DetectionResult(true, CrisisSeverity.CRITICAL, matched);
        }

        // Check HIGH tier
        for (String phrase : HIGH_PHRASES) {
            if (lower.contains(phrase) && !isNegated(lower, phrase)) {
                matched.add(phrase);
            }
        }
        if (!matched.isEmpty()) {
            return new DetectionResult(true, CrisisSeverity.HIGH, matched);
        }

        return new DetectionResult(false, null, List.of());
    }

    /**
     * Returns true when the matched phrase is immediately preceded by a negation word,
     * reducing false positives on statements like "I don't want to die".
     */
    private boolean isNegated(String lower, String phrase) {
        int idx = lower.indexOf(phrase);
        if (idx <= 0) return false;
        String before = lower.substring(Math.max(0, idx - 20), idx);
        for (String neg : NEGATION_PREFIXES) {
            if (before.endsWith(neg) || before.contains(neg)) return true;
        }
        return false;
    }
}
