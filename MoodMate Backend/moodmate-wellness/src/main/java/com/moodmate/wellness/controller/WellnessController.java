package com.moodmate.wellness.controller;

import com.moodmate.wellness.dto.ToggleGoalResponse;
import com.moodmate.wellness.dto.WellnessStateResponse;
import com.moodmate.wellness.service.WellnessService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wellness")
@RequiredArgsConstructor
public class WellnessController {

    private final WellnessService wellnessService;

    @GetMapping("/state")
    public WellnessStateResponse state(@RequestHeader("X-User-Id") Long userId) {
        return wellnessService.getState(userId);
    }

    @PostMapping("/goals/{key}/toggle")
    public ToggleGoalResponse toggleGoal(@RequestHeader("X-User-Id") Long userId, @PathVariable String key) {
        return wellnessService.toggleGoal(userId, key);
    }

    @PostMapping("/streak/shield")
    public WellnessStateResponse buyStreakShield(@RequestHeader("X-User-Id") Long userId) {
        return wellnessService.buyStreakShield(userId);
    }

    // Feature 14 (Shop Improvements) - backs the frontend's "Double XP (24h)" boost tile.
    @PostMapping("/boosts/double-xp")
    public WellnessStateResponse buyDoubleXpBoost(@RequestHeader("X-User-Id") Long userId) {
        return wellnessService.buyDoubleXpBoost(userId);
    }
}
