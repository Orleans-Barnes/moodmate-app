package com.moodmate.wellness.controller;

import com.moodmate.wellness.dto.*;
import com.moodmate.wellness.service.HabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public List<HabitResponse> list(@RequestHeader("X-User-Id") Long userId) {
        return habitService.listHabits(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HabitResponse create(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody CreateHabitRequest request) {
        return habitService.createHabit(userId, request);
    }

    @PutMapping("/{id}")
    public HabitResponse update(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                 @Valid @RequestBody UpdateHabitRequest request) {
        return habitService.updateHabit(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        habitService.deleteHabit(userId, id);
    }

    @PostMapping("/{id}/toggle")
    public ToggleHabitResponse toggle(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return habitService.toggleCompletion(userId, id);
    }

    @GetMapping("/{id}/history")
    public List<HabitCompletionDto> history(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return habitService.getHistory(userId, id, from, to);
    }

    @GetMapping("/{id}/stats")
    public HabitStatsResponse stats(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return habitService.getStats(userId, id);
    }
}
