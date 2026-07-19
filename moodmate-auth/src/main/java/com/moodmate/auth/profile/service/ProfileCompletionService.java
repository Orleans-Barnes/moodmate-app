package com.moodmate.auth.profile.service;

import com.moodmate.auth.profile.dto.ProfileStatusResponse;
import com.moodmate.auth.profile.entity.StudentProfile;
import com.moodmate.auth.profile.entity.WellnessPreference;
import com.moodmate.auth.profile.repository.StudentProfileRepository;
import com.moodmate.auth.profile.repository.WellnessPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Phase 1C-i (Change 1) — standalone, not folded into StudentProfileService or
 * WellnessPreferenceService, deliberately. As more profile pieces get added later (avatar,
 * emergency contacts, peer mentor certification, counsellor verification, premium status), this
 * is the one place that changes to account for them — the two feature services stay focused only
 * on their own entity.
 */
@Service
@RequiredArgsConstructor
public class ProfileCompletionService {

    // Weighted so the score can grow smoothly (0/40/70/85/100) instead of coarse 0/50/100 jumps -
    // see the reviewed decision. Weights are additive and sum to 100; adding a new weighted piece
    // later means rebalancing these constants, not changing storage. Named constants, not inline
    // magic numbers, per the reviewed checklist.
    private static final int PROGRAMME_WEIGHT = 40;
    private static final int YEAR_WEIGHT = 30;
    private static final int GOALS_WEIGHT = 15;
    private static final int SUPPORT_WEIGHT = 15;

    private static final int SKIP_COOLDOWN_DAYS = 7;

    private final StudentProfileRepository studentProfileRepo;
    private final WellnessPreferenceRepository wellnessPreferenceRepo;

    @Transactional(readOnly = true)
    public ProfileStatusResponse calculate(Long userId) {
        StudentProfile academic = studentProfileRepo.findByUserId(userId).orElse(null);
        WellnessPreference wellness = wellnessPreferenceRepo.findByUserId(userId).orElse(null);

        int completion = 0;
        boolean hasProgramme = academic != null && academic.getProgramme() != null;
        boolean hasYear = academic != null && academic.getYearOfStudy() != null;
        boolean hasGoals = wellness != null && !wellness.getGoals().isEmpty();
        boolean hasSupport = wellness != null && !wellness.getPreferredSupport().isEmpty();

        if (hasProgramme) completion += PROGRAMME_WEIGHT;
        if (hasYear) completion += YEAR_WEIGHT;
        if (hasGoals) completion += GOALS_WEIGHT;
        if (hasSupport) completion += SUPPORT_WEIGHT;

        boolean needsAcademicProfile = !hasProgramme || !hasYear;
        boolean wellnessCompleted = wellness != null && wellness.getCompletedAt() != null;
        boolean needsGoals = !wellnessCompleted;

        return new ProfileStatusResponse(completion, needsAcademicProfile, needsGoals,
                canShowOnboarding(wellness, wellnessCompleted));
    }

    /** Never prompts again once completed. Otherwise, only re-prompts after SKIP_COOLDOWN_DAYS
     *  have passed since the more recent of skippedAt/lastPromptedAt, so a user who skips (or
     *  just navigates away without deciding) isn't nagged on every app open. */
    private boolean canShowOnboarding(WellnessPreference wellness, boolean completed) {
        if (completed) return false;
        if (wellness == null) return true;

        Instant lastSeen = laterOf(wellness.getSkippedAt(), wellness.getLastPromptedAt());
        if (lastSeen == null) return true;

        return Duration.between(lastSeen, Instant.now()).toDays() >= SKIP_COOLDOWN_DAYS;
    }

    private static Instant laterOf(Instant a, Instant b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }
}
