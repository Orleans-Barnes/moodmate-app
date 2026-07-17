package com.moodmate.mood.controller;

import com.moodmate.mood.dto.CheckInRequest;
import com.moodmate.mood.dto.CheckInResponse;
import com.moodmate.mood.dto.CorrelationResponse;
import com.moodmate.mood.dto.EmotionFrequencyResponse;
import com.moodmate.mood.dto.MoodHistoryResponse;
import com.moodmate.mood.dto.MoodTrendResponse;
import com.moodmate.mood.dto.StressTrendResponse;
import com.moodmate.mood.service.MoodAnalyticsService;
import com.moodmate.mood.service.MoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/** Path matches the monolith's CheckInController exactly (/api/checkins, plural) - the
 * pre-existing gateway route used "/api/checkin" (singular), which would not have matched this at
 * all; see moodmate-gateway/application.yml for the fix. */
@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
public class CheckInController {

    private final MoodService moodService;
    private final MoodAnalyticsService moodAnalyticsService;

    @PostMapping
    public ResponseEntity<CheckInResponse> create(@RequestHeader("X-User-Id") Long userId,
                                                   @Valid @RequestBody CheckInRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(moodService.recordCheckIn(userId, request));
    }

    @GetMapping
    public Page<CheckInResponse> history(@RequestHeader("X-User-Id") Long userId,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return moodService.history(userId, PageRequest.of(page, size));
    }

    // ── Additive, not part of the monolith - see MoodHistoryResponse's doc comment ─────────────

    @GetMapping("/trend")
    public MoodHistoryResponse trend(@RequestHeader("X-User-Id") Long userId,
                                      @RequestParam(defaultValue = "30") int days) {
        return moodService.trend(userId, days);
    }

    /** Counsellor/Admin scoped - trusts the X-User-Role header the gateway's JwtAuthFilter sets
     * from the verified JWT. Only safe because this service is not reachable except through the
     * gateway or another trusted service on the internal network - see the /internal/** pattern
     * used elsewhere (moodmate-auth, moodmate-wallet) for endpoints that must never be reachable
     * from an end-user token at all, which this one is not (any authenticated request reaches it,
     * gated only by the role check below). */
    @GetMapping("/student/{studentId}/trend")
    public MoodHistoryResponse studentTrend(@RequestHeader("X-User-Role") String role,
                                             @PathVariable Long studentId,
                                             @RequestParam(defaultValue = "30") int days) {
        if (!role.equals("COUNSELLOR") && !role.equals("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires COUNSELLOR or ADMIN role");
        }
        return moodService.trend(studentId, days);
    }

    @GetMapping("/count")
    public Map<String, Long> count(@RequestHeader("X-User-Id") Long userId) {
        return Map.of("total", moodService.countForUser(userId));
    }

    // ── Feature 8 (Mood Analytics) - additive, not in the monolith ─────────────────────────────

    @GetMapping("/analytics/trend/weekly")
    public MoodTrendResponse weeklyTrend(@RequestHeader("X-User-Id") Long userId) {
        return moodAnalyticsService.weeklyTrend(userId);
    }

    @GetMapping("/analytics/trend/monthly")
    public MoodTrendResponse monthlyTrend(@RequestHeader("X-User-Id") Long userId) {
        return moodAnalyticsService.monthlyTrend(userId);
    }

    @GetMapping("/analytics/stress-trend")
    public StressTrendResponse stressTrend(@RequestHeader("X-User-Id") Long userId,
                                            @RequestParam(defaultValue = "30") int days) {
        return moodAnalyticsService.stressTrend(userId, days);
    }

    @GetMapping("/analytics/emotion-frequency")
    public EmotionFrequencyResponse emotionFrequency(@RequestHeader("X-User-Id") Long userId,
                                                       @RequestParam(defaultValue = "30") int days) {
        return moodAnalyticsService.emotionFrequency(userId, days);
    }

    @GetMapping("/analytics/mood-correlation")
    public CorrelationResponse moodCorrelation(@RequestHeader("X-User-Id") Long userId,
                                                @RequestParam(defaultValue = "30") int days) {
        return moodAnalyticsService.moodCorrelation(userId, days);
    }

    @GetMapping("/analytics/habit-correlation")
    public CorrelationResponse habitCorrelation(@RequestHeader("X-User-Id") Long userId,
                                                 @RequestParam(defaultValue = "30") int days) {
        return moodAnalyticsService.habitCorrelation(userId, days);
    }

    @GetMapping("/analytics/sleep-correlation")
    public CorrelationResponse sleepCorrelation(@RequestHeader("X-User-Id") Long userId,
                                                 @RequestParam(defaultValue = "30") int days) {
        return moodAnalyticsService.sleepCorrelation(userId, days);
    }
}
