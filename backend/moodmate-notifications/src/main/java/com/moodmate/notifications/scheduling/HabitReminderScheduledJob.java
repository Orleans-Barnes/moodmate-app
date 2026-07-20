package com.moodmate.notifications.scheduling;

import com.moodmate.notifications.client.WellnessServiceClient;
import com.moodmate.notifications.client.dto.UserHabitTodaySummary;
import com.moodmate.notifications.dto.CreateNotificationRequest;
import com.moodmate.notifications.entity.NotificationType;
import com.moodmate.notifications.repository.NotificationRepository;
import com.moodmate.notifications.scheduling.rules.HabitReminderRule;
import com.moodmate.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Phase 1E, Step 4 - the third wired scheduled job, same shape as MoodReminderScheduledJob (see
 * that class's doc comment for the shared design rationale). Runs every 30 minutes;
 * HabitReminderRule's own 7pm cutoff means every run before then is a cheap no-op, same reasoning
 * as the mood job.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HabitReminderScheduledJob {

    private final WellnessServiceClient wellnessServiceClient;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0/30 * * * *")
    public void run() {
        LocalTime now = LocalTime.now(ZoneOffset.UTC);
        Instant startOfToday = LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<UserHabitTodaySummary> candidates = wellnessServiceClient.habitsTodaySummary();
        int created = 0;

        for (UserHabitTodaySummary candidate : candidates) {
            boolean shouldRemind = HabitReminderRule.shouldRemind(
                    candidate.totalHabitsToday(), candidate.completedHabitsToday(), now);
            if (!shouldRemind) continue;

            boolean alreadyRemindedToday = notificationRepository.existsByUserIdAndTypeAndCreatedAtAfter(
                    candidate.userId(), NotificationType.HABIT_REMINDER, startOfToday);
            if (alreadyRemindedToday) continue;

            notificationService.create(new CreateNotificationRequest(
                    candidate.userId(),
                    NotificationType.HABIT_REMINDER,
                    "A habit is waiting on you",
                    "You've still got habits to check off today - small steps count.",
                    "HabitTracker",
                    null,
                    null,
                    null
            ));
            created++;
        }

        if (created > 0) {
            log.info("HabitReminderScheduledJob created {} habit reminder(s) out of {} candidate(s)", created, candidates.size());
        }
    }
}
