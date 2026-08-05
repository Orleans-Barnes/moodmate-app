package com.moodmate.wellness.service;

import com.moodmate.wellness.config.HabitProperties;
import com.moodmate.wellness.config.TreeProperties;
import com.moodmate.wellness.dto.*;
import com.moodmate.wellness.engine.GoalEngine;
import com.moodmate.wellness.engine.HabitEngine;
import com.moodmate.wellness.entity.Habit;
import com.moodmate.wellness.entity.HabitCompletion;
import com.moodmate.wellness.entity.WellnessProfile;
import com.moodmate.wellness.exception.ApiException;
import com.moodmate.wellness.repository.HabitCompletionRepository;
import com.moodmate.wellness.repository.HabitRepository;
import com.moodmate.wellness.repository.WellnessProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * User-defined habits - CRUD, daily toggle with streak tracking, history, and stats. Deliberately
 * separate from WellnessService's daily-goal-template flow (see HabitEngine's class doc): a habit
 * is created and named by the user themselves, and each has its own independent streak, whereas
 * daily goals are a fixed templated set with one shared streak.
 *
 * XP: completing a habit credits WellnessProfile.treeXp directly (same field the Wellness Tree on
 * Home reads), by the habit's own xpPerCompletion. Un-completing the same day's entry reverses
 * the same amount, so repeatedly toggling a single habit on/off cannot be used to farm XP.
 */
@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitCompletionRepository habitCompletionRepository;
    private final WellnessProfileRepository wellnessProfileRepository;
    private final HabitProperties habitProperties;
    private final TreeProperties treeProperties;

    @Transactional(readOnly = true)
    public List<HabitResponse> listHabits(Long userId) {
        LocalDate today = LocalDate.now();
        return habitRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(h -> toResponse(h, isCompletedOn(h.getId(), today)))
                .toList();
    }

    @Transactional
    public HabitResponse createHabit(Long userId, CreateHabitRequest request) {
        Habit.HabitBuilder builder = Habit.builder()
                .userId(userId)
                .name(request.name().trim())
                .xpPerCompletion(habitProperties.defaultXpPerCompletion() > 0 ? habitProperties.defaultXpPerCompletion() : 10);
        if (request.icon() != null && !request.icon().isBlank()) {
            builder.icon(request.icon());
        }
        if (request.color() != null && !request.color().isBlank()) {
            builder.color(request.color());
        }
        Habit saved = habitRepository.save(builder.build());
        return toResponse(saved, false);
    }

    @Transactional
    public HabitResponse updateHabit(Long userId, Long habitId, UpdateHabitRequest request) {
        Habit habit = getOwnedHabit(userId, habitId);
        habit.setName(request.name().trim());
        if (request.icon() != null && !request.icon().isBlank()) {
            habit.setIcon(request.icon());
        }
        if (request.color() != null && !request.color().isBlank()) {
            habit.setColor(request.color());
        }
        habitRepository.save(habit);
        return toResponse(habit, isCompletedOn(habit.getId(), LocalDate.now()));
    }

    @Transactional
    public void deleteHabit(Long userId, Long habitId) {
        Habit habit = getOwnedHabit(userId, habitId);
        habitRepository.delete(habit); // habit_completions cascade via ON DELETE CASCADE (V4 migration)
    }

    @Transactional
    public ToggleHabitResponse toggleCompletion(Long userId, Long habitId) {
        Habit habit = getOwnedHabit(userId, habitId);
        LocalDate today = LocalDate.now();
        WellnessProfile profile = getOrCreateProfile(userId);

        Optional<HabitCompletion> existing = habitCompletionRepository.findByHabitIdAndCompletionDate(habitId, today);
        boolean completed;

        if (existing.isPresent()) {
            // Undo today's completion
            habitCompletionRepository.deleteByHabitIdAndCompletionDate(habitId, today);
            habit.setStreakCount(HabitEngine.streakOnUncomplete(habit.getStreakCount()));
            habit.setLastCompletedDate(
                    habitCompletionRepository.findTopByHabitIdAndCompletionDateLessThanOrderByCompletionDateDesc(habitId, today)
                            .map(HabitCompletion::getCompletionDate)
                            .orElse(null));
            profile.setTreeXp(Math.max(0, profile.getTreeXp() - habit.getXpPerCompletion()));
            completed = false;
        } else {
            habitCompletionRepository.save(HabitCompletion.builder()
                    .habitId(habitId).userId(userId).completionDate(today).build());
            habit.setStreakCount(HabitEngine.nextStreakOnComplete(habit.getLastCompletedDate(), habit.getStreakCount(), today));
            habit.setLastCompletedDate(today);
            profile.setTreeXp(profile.getTreeXp() + habit.getXpPerCompletion());
            completed = true;
        }

        profile.setTreeStage(GoalEngine.stageForXp(profile.getTreeXp(), treeProperties.xpMax()));
        wellnessProfileRepository.save(profile);
        habitRepository.save(habit);

        return new ToggleHabitResponse(completed, habit.getStreakCount(), profile.getTreeXp());
    }

    @Transactional(readOnly = true)
    public List<HabitCompletionDto> getHistory(Long userId, Long habitId, LocalDate from, LocalDate to) {
        getOwnedHabit(userId, habitId); // 404s if not owned, otherwise unused - ownership check only
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(90);
        return habitCompletionRepository
                .findByHabitIdAndCompletionDateBetweenOrderByCompletionDateDesc(habitId, effectiveFrom, effectiveTo)
                .stream()
                .map(c -> new HabitCompletionDto(c.getCompletionDate()))
                .toList();
    }

    @Transactional(readOnly = true)
    public HabitStatsResponse getStats(Long userId, Long habitId) {
        Habit habit = getOwnedHabit(userId, habitId);
        long total = habitCompletionRepository.countByHabitId(habitId);
        long last30 = habitCompletionRepository.countByHabitIdAndCompletionDateGreaterThanEqual(habitId, LocalDate.now().minusDays(29));
        List<LocalDate> allDates = habitCompletionRepository.findByHabitIdOrderByCompletionDateAsc(habitId).stream()
                .map(HabitCompletion::getCompletionDate)
                .toList();
        int longest = Math.max(HabitEngine.longestStreak(allDates), habit.getStreakCount());
        double rate = Math.round((last30 / 30.0) * 1000.0) / 1000.0;

        return new HabitStatsResponse(habit.getId(), habit.getStreakCount(), longest, total, rate);
    }

    /** Phase 1E, Step 4 - backs GET /internal/wellness/habits/today-summary. Merges two grouped
     * counts (total habits per user, completions-today per user) rather than iterating per-user -
     * one query each, regardless of how many users/habits exist. "Today" is LocalDate.now() with
     * no explicit zone, matching every other date computed in this class (toggleCompletion,
     * listHabits, etc.) rather than introducing a UTC-explicit inconsistency within this one file. */
    @Transactional(readOnly = true)
    public List<UserHabitTodaySummary> todaySummaryForAllUsers() {
        LocalDate today = LocalDate.now();
        Map<Long, Long> totals = new HashMap<>();
        habitRepository.countHabitsPerUser().forEach(d -> totals.put(d.userId(), d.count()));
        Map<Long, Long> completedToday = new HashMap<>();
        habitCompletionRepository.countCompletionsPerUserOnDate(today).forEach(d -> completedToday.put(d.userId(), d.count()));

        return totals.entrySet().stream()
                .map(e -> new UserHabitTodaySummary(
                        e.getKey(),
                        e.getValue().intValue(),
                        completedToday.getOrDefault(e.getKey(), 0L).intValue()))
                .toList();
    }

    private boolean isCompletedOn(Long habitId, LocalDate date) {
        return habitCompletionRepository.findByHabitIdAndCompletionDate(habitId, date).isPresent();
    }

    private Habit getOwnedHabit(Long userId, Long habitId) {
        return habitRepository.findByIdAndUserId(habitId, userId)
                .orElseThrow(() -> new ApiException("Habit not found: " + habitId, HttpStatus.NOT_FOUND));
    }

    private WellnessProfile getOrCreateProfile(Long userId) {
        return wellnessProfileRepository.findById(userId)
                .orElseGet(() -> wellnessProfileRepository.save(WellnessProfile.builder().userId(userId).build()));
    }

    private HabitResponse toResponse(Habit h, boolean completedToday) {
        return new HabitResponse(h.getId(), h.getName(), h.getIcon(), h.getColor(),
                completedToday, h.getStreakCount(), h.getXpPerCompletion());
    }
}
