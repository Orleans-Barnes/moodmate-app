package com.moodmate.wellness.controller;

import com.moodmate.wellness.dto.*;
import com.moodmate.wellness.service.SleepService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sleep")
@RequiredArgsConstructor
public class SleepController {

    private final SleepService sleepService;

    @GetMapping
    public List<SleepLogResponse> list(@RequestHeader("X-User-Id") Long userId) {
        return sleepService.listLogs(userId);
    }

    /** Upserts by date - see SleepService.upsertLog's doc comment. Matches
     * SleepTrackerScreen.tsx's existing POST /api/sleep call exactly. */
    @PostMapping
    public SleepLogResponse upsert(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody UpsertSleepLogRequest request) {
        return sleepService.upsertLog(userId, request);
    }

    @PutMapping("/{id}")
    public SleepLogResponse update(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                    @Valid @RequestBody UpsertSleepLogRequest request) {
        return sleepService.updateLog(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        sleepService.deleteLog(userId, id);
    }

    @GetMapping("/analytics/weekly")
    public SleepAnalyticsResponse weeklyAnalytics(@RequestHeader("X-User-Id") Long userId) {
        return sleepService.getAnalytics(userId, 7);
    }

    @GetMapping("/analytics/monthly")
    public SleepAnalyticsResponse monthlyAnalytics(@RequestHeader("X-User-Id") Long userId) {
        return sleepService.getAnalytics(userId, 30);
    }

    @GetMapping("/goal")
    public SleepGoalResponse getGoal(@RequestHeader("X-User-Id") Long userId) {
        return sleepService.getGoal(userId);
    }

    @PutMapping("/goal")
    public SleepGoalResponse updateGoal(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody UpdateSleepGoalRequest request) {
        return sleepService.updateGoal(userId, request);
    }
}
