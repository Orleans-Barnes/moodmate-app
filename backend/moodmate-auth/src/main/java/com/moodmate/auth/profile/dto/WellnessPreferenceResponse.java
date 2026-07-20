package com.moodmate.auth.profile.dto;

import java.time.Instant;
import java.util.Set;

/**
 * completed/skipped remain booleans derived from completedAt/skippedAt (Change 3) — any
 * completion/skip LOGIC on the frontend must branch on these booleans, computed once here, not by
 * the frontend re-deriving "is this null" itself. completedAt/skippedAt are exposed alongside them
 * (Phase 1C-i.6) purely for DISPLAY purposes ("completed 3 days ago", a skip-reminder countdown) -
 * this is additive, not a reversal of Change 3's original concern, which was about not making the
 * frontend re-implement completion logic, not about hiding the raw values entirely. DTO-only,
 * never the WellnessPreference entity.
 */
public record WellnessPreferenceResponse(
    Set<String> goals, Set<String> challenges, Set<String> preferredSupport,
    boolean completed, boolean skipped,
    Instant completedAt, Instant skippedAt,
    Instant updatedAt
) {}
