package com.moodmate.auth.profile.dto;

/** Backs GET /api/users/me/profile-status. Assembled by ProfileCompletionService, not by
 *  StudentProfileService/WellnessPreferenceService directly — keeps completion-scoring logic in
 *  one place as more profile pieces (avatar, emergency contacts, peer mentor certification, ...)
 *  get folded into "profile completeness" later, without repeatedly editing the two
 *  feature-specific services. */
public record ProfileStatusResponse(
    int profileCompletion,
    boolean needsAcademicProfile,
    boolean needsGoals,
    boolean canShowOnboarding
) {}
