package com.moodmate.auth.profile.enums;

/** Phase 1C-i. "What areas would you like support with?" — supportive, non-diagnostic language.
 *  Deliberately does not duplicate WellnessGoal.java's values (e.g. no bare "STRESS" here since
 *  WellnessGoal already has LESS_STRESS) — goals and challenges are different concepts and a
 *  student can select from both independently. */
public enum Challenge {
    ACADEMIC_PRESSURE,
    LONELINESS,
    ANXIETY,
    BURNOUT,
    FINANCIAL_STRESS,
    RELATIONSHIPS,
    TIME_MANAGEMENT,
    CAREER_CONCERNS
}
