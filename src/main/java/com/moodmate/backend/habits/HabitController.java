package com.moodmate.backend.habits;

import com.moodmate.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitRepository            habitRepo;
    private final HabitCompletionRepository  completionRepo;
    private final CurrentUser                currentUser;

    record HabitInput(String name, String icon, String color) {}
    record HabitView(Long id, String name, String icon, String color, boolean completedToday, int streakDays) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<HabitView> list() {
        Long userId   = currentUser.id();
        LocalDate today = LocalDate.now();
        return habitRepo.findByUserIdAndArchivedFalseOrderByCreatedAtAsc(userId).stream()
                .map(h -> toView(h, today, userId))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public HabitView create(@RequestBody HabitInput input) {
        Long userId = currentUser.id();
        Habit h = habitRepo.save(Habit.builder()
                .userId(userId)
                .name(input.name() != null ? input.name() : "New habit")
                .icon(input.icon() != null ? input.icon() : "✅")
                .color(input.color() != null ? input.color() : "#5F9E7C")
                .archived(false)
                .build());
        return toView(h, LocalDate.now(), userId);
    }

    @PostMapping("/{id}/toggle")
    @Transactional
    public Map<String, Boolean> toggle(@PathVariable Long id) {
        Long userId = currentUser.id();
        Habit habit = habitRepo.findById(id)
                .filter(h -> h.getUserId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        LocalDate today = LocalDate.now();
        var existing = completionRepo.findByHabitIdAndCompletedOn(id, today);
        if (existing.isPresent()) {
            completionRepo.delete(existing.get());
            return Map.of("completed", false);
        } else {
            completionRepo.save(HabitCompletion.builder()
                    .habitId(id).userId(userId).completedOn(today).build());
            return Map.of("completed", true);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void archive(@PathVariable Long id) {
        Long userId = currentUser.id();
        habitRepo.findById(id)
                .filter(h -> h.getUserId().equals(userId))
                .ifPresent(h -> { h.setArchived(true); habitRepo.save(h); });
    }

    private HabitView toView(Habit h, LocalDate today, Long userId) {
        boolean done   = completionRepo.findByHabitIdAndCompletedOn(h.getId(), today).isPresent();
        int streak     = calcStreak(h.getId(), today);
        return new HabitView(h.getId(), h.getName(), h.getIcon(), h.getColor(), done, streak);
    }

    private int calcStreak(Long habitId, LocalDate today) {
        int streak = 0;
        LocalDate day = today;
        while (completionRepo.findByHabitIdAndCompletedOn(habitId, day).isPresent()) {
            streak++;
            day = day.minusDays(1);
            if (streak > 365) break; // safety cap
        }
        return streak;
    }
}
