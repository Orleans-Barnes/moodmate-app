package com.moodmate.wellness.service;

import com.moodmate.wellness.dto.DailyWellnessStat;
import com.moodmate.wellness.entity.HabitCompletion;
import com.moodmate.wellness.entity.SleepLog;
import com.moodmate.wellness.repository.HabitCompletionRepository;
import com.moodmate.wellness.repository.SleepLogRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Covers Feature 8's cross-service read: WellnessAnalyticsService.dailyStats() must return one
 * entry per calendar day in range, even days with zero habit completions or no sleep log - see
 * DailyWellnessStat's doc comment for why that matters to the caller (moodmate-mood). */
class WellnessAnalyticsServiceTest {

    @Test
    void everyDayInRangeIsPresentEvenWithNoActivity() {
        HabitCompletionRepository habitCompletionRepo = mock(HabitCompletionRepository.class);
        SleepLogRepository sleepLogRepo = mock(SleepLogRepository.class);
        WellnessAnalyticsService service = new WellnessAnalyticsService(habitCompletionRepo, sleepLogRepo);

        LocalDate today = LocalDate.now();
        LocalDate twoDaysAgo = today.minusDays(2);

        HabitCompletion completion1 = HabitCompletion.builder().habitId(1L).userId(9L).completionDate(today).build();
        HabitCompletion completion2 = HabitCompletion.builder().habitId(2L).userId(9L).completionDate(today).build();
        SleepLog sleepLog = SleepLog.builder().userId(9L).logDate(twoDaysAgo).bedtime("22:00").wakeTime("06:00")
                .durationMins(480).quality(4).build();

        when(habitCompletionRepo.findByUserIdAndCompletionDateBetween(eq(9L), any(), any()))
                .thenReturn(List.of(completion1, completion2));
        when(sleepLogRepo.findByUserIdAndLogDateBetweenOrderByLogDateDesc(eq(9L), any(), any()))
                .thenReturn(List.of(sleepLog));

        List<DailyWellnessStat> stats = service.dailyStats(9L, 3);

        assertEquals(3, stats.size());
        DailyWellnessStat todayStat = stats.stream().filter(s -> s.date().equals(today)).findFirst().orElseThrow();
        assertEquals(2, todayStat.habitsCompleted());
        assertNull(todayStat.sleepMinutes());

        DailyWellnessStat twoDaysAgoStat = stats.stream().filter(s -> s.date().equals(twoDaysAgo)).findFirst().orElseThrow();
        assertEquals(0, twoDaysAgoStat.habitsCompleted());
        assertEquals(480, twoDaysAgoStat.sleepMinutes());
    }
}
