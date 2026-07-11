package com.moodmate.backend.push;

import com.moodmate.backend.wellness.DailyGoalTemplate;
import com.moodmate.backend.wellness.DailyGoalTemplateRepository;
import com.moodmate.backend.wellness.GoalCompletion;
import com.moodmate.backend.wellness.GoalCompletionRepository;
import com.moodmate.backend.wellness.WellnessProfile;
import com.moodmate.backend.wellness.WellnessProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Every evening at 8 PM, finds users who have an active streak but haven't
 * finished all of today's goals, and sends them a push reminder.
 *
 * Only runs if the user has at least one registered push token —
 * PushNotificationService silently skips users with no tokens.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StreakReminderJob {

    private final WellnessProfileRepository wellnessProfileRepository;
    private final GoalCompletionRepository  goalCompletionRepository;
    private final DailyGoalTemplateRepository goalTemplateRepository;
    private final PushNotificationService   pushNotificationService;

    @Scheduled(cron = "0 0 20 * * *")   // 8:00 PM every day
    public void sendStreakReminders() {
        LocalDate today = LocalDate.now();

        List<WellnessProfile> atRisk = wellnessProfileRepository.findByStreakCountGreaterThan(0);
        List<DailyGoalTemplate> activeTemplates = goalTemplateRepository.findByActiveTrueOrderBySortOrder();
        int totalGoals = activeTemplates.size();

        if (totalGoals == 0) return;

        int reminded = 0;
        for (WellnessProfile profile : atRisk) {
            long done = goalCompletionRepository
                    .findByUserIdAndCompletionDate(profile.getUserId(), today)
                    .stream()
                    .filter(GoalCompletion::isDone)
                    .count();

            if (done < totalGoals) {
                String streakLabel = profile.getStreakCount() == 1
                        ? "1-day streak"
                        : profile.getStreakCount() + "-day streak";

                pushNotificationService.sendToUser(
                        profile.getUserId(),
                        "Don't break your streak! 🔥",
                        "You're on a " + streakLabel + ". Complete today's goals before midnight!",
                        Map.of("type", "streak-reminder", "screen", "Home")
                );
                reminded++;
            }
        }

        log.info("Streak reminder job: {} / {} users reminded", reminded, atRisk.size());
    }
}
