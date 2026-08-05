package com.moodmate.wellness.service;

import com.moodmate.wellness.dto.DailyWellnessStat;
import com.moodmate.wellness.entity.HabitCompletion;
import com.moodmate.wellness.entity.SleepLog;
import com.moodmate.wellness.repository.HabitCompletionRepository;
import com.moodmate.wellness.repository.SleepLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** New for Feature 8 (Mood Analytics) - backs InternalWellnessController's daily-stats endpoint,
 * the one thing this service exposes cross-service for moodmate-mood's habit/sleep correlation
 * analytics. Deliberately a thin read-only aggregation, not a general-purpose analytics engine of
 * its own - the actual correlation math lives in moodmate-mood's AnalyticsEngine, which is the
 * consumer that needs it. */
@Service
@RequiredArgsConstructor
public class WellnessAnalyticsService {

    private final HabitCompletionRepository habitCompletionRepository;
    private final SleepLogRepository sleepLogRepository;

    @Transactional(readOnly = true)
    public List<DailyWellnessStat> dailyStats(Long userId, int days) {
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(Math.max(0, days - 1L));

        Map<LocalDate, Long> completionsByDate = habitCompletionRepository
                .findByUserIdAndCompletionDateBetween(userId, from, today).stream()
                .collect(Collectors.groupingBy(HabitCompletion::getCompletionDate, Collectors.counting()));

        Map<LocalDate, Integer> sleepMinutesByDate = sleepLogRepository
                .findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, from, today).stream()
                .collect(Collectors.toMap(SleepLog::getLogDate, SleepLog::getDurationMins, (a, b) -> a));

        List<DailyWellnessStat> stats = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(today); date = date.plusDays(1)) {
            int habitsCompleted = completionsByDate.getOrDefault(date, 0L).intValue();
            Integer sleepMinutes = sleepMinutesByDate.get(date);
            stats.add(new DailyWellnessStat(date, habitsCompleted, sleepMinutes));
        }
        return stats;
    }
}
