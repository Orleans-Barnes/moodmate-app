package com.moodmate.mood.controller;

import com.moodmate.mood.dto.MoodHistoryResponse;
import com.moodmate.mood.service.MoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Service-to-service only, same /internal/** pattern as moodmate-wallet's InternalWalletController
 * and moodmate-auth's internal user endpoints - deliberately NOT under /api/checkins/**, so no
 * gateway route can forward it. Added for moodmate-ai's GET /api/insights, which needs a user's
 * recent stress/energy/emotion history to build a wellness score and narrative summary. Reuses
 * MoodService.trend() (the exact same logic already backing the authenticated GET
 * /api/checkins/trend and the counsellor-facing GET /api/checkins/student/{id}/trend) rather than
 * duplicating any business logic - this is just a new entry point into it.
 */
@RestController
@RequestMapping("/internal/mood")
@RequiredArgsConstructor
public class InternalMoodController {

    private final MoodService moodService;

    @GetMapping("/{userId}/trend")
    public MoodHistoryResponse trend(@PathVariable Long userId, @RequestParam(defaultValue = "30") int days) {
        return moodService.trend(userId, days);
    }
}
