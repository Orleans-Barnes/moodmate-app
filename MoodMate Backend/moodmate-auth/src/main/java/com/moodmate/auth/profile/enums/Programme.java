package com.moodmate.auth.profile.enums;

/**
 * Programme catalogue — Phase 1C-i. Backend is the source of truth for *valid values only*;
 * display labels and any faculty-based grouping live in the frontend's own catalogue
 * (src/data/programmes.ts), same abstraction pattern as the institution catalogue from Phase
 * 1C-ii. Deliberately real, specific programme names (not broad faculties like "ENGINEERING")
 * per the reviewed decision — a specific enum here still lets the frontend group multiple values
 * under one faculty heading for display, but a broad enum here couldn't be un-broadened later
 * without a migration.
 */
public enum Programme {
    COMPUTER_SCIENCE,
    INFORMATION_TECHNOLOGY,
    COMPUTER_ENGINEERING,
    ELECTRICAL_ENGINEERING,
    MECHANICAL_ENGINEERING,
    CIVIL_ENGINEERING,
    BUSINESS_ADMINISTRATION,
    ACCOUNTING,
    MEDICINE,
    NURSING,
    PHARMACY,
    LAW,
    PSYCHOLOGY,
    ECONOMICS,
    AGRICULTURE,
    ARCHITECTURE,
    OTHER
}
