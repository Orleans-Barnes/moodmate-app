package com.moodmate.backend.crisis;

/** How urgent the flagged content is. */
public enum CrisisSeverity {
    /** Unambiguous self-harm / suicide language — immediate counsellor notification. */
    CRITICAL,
    /** High-risk language (hopelessness, burden, disappearing) — counsellor review within 24h. */
    HIGH
}
