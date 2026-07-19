package com.moodmate.auth.profile.mapper;

import com.moodmate.auth.profile.dto.WellnessPreferenceResponse;
import com.moodmate.auth.profile.entity.WellnessPreference;

import java.util.stream.Collectors;

/** Phase 1C-i. Same role as StudentProfileMapper — the only place a WellnessPreference entity is
 *  turned into its DTO. completed/skipped booleans are derived here from completedAt/skippedAt so
 *  completion LOGIC has one source of truth (Change 3); the raw timestamps are also included
 *  (Phase 1C-i.6) for frontend display purposes only. */
public final class WellnessPreferenceMapper {

    private WellnessPreferenceMapper() {}

    public static WellnessPreferenceResponse toDto(WellnessPreference p) {
        return new WellnessPreferenceResponse(
                p.getGoals().stream().map(Enum::name).collect(Collectors.toSet()),
                p.getChallenges().stream().map(Enum::name).collect(Collectors.toSet()),
                p.getPreferredSupport().stream().map(Enum::name).collect(Collectors.toSet()),
                p.getCompletedAt() != null,
                p.getSkippedAt() != null,
                p.getCompletedAt(),
                p.getSkippedAt(),
                p.getUpdatedAt()
        );
    }
}
