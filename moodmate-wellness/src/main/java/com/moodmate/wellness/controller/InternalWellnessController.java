package com.moodmate.wellness.controller;

import com.moodmate.wellness.dto.DailyWellnessStat;
import com.moodmate.wellness.service.WellnessAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Service-to-service only, new for Feature 8 (Mood Analytics) - same internal-only,
 * gateway-unreachable path pattern as moodmate-auth's InternalUserController and
 * moodmate-wallet's InternalWalletController (no /api/wellness/** gateway route predicate matches
 * /internal/**, so this is only reachable by another service calling this service directly on its
 * internal address/port). Called by moodmate-mood's WellnessServiceClient for habit/sleep
 * correlation analytics. */
@RestController
@RequestMapping("/internal/wellness")
@RequiredArgsConstructor
public class InternalWellnessController {

    private final WellnessAnalyticsService wellnessAnalyticsService;

    @GetMapping("/{userId}/daily-stats")
    public List<DailyWellnessStat> dailyStats(@PathVariable Long userId,
                                               @RequestParam(defaultValue = "30") int days) {
        return wellnessAnalyticsService.dailyStats(userId, days);
    }
}
