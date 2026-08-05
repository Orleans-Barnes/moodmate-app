package com.moodmate.notifications.scheduling;

import com.moodmate.notifications.client.MoodServiceClient;
import com.moodmate.notifications.client.dto.UserLastCheckIn;
import com.moodmate.notifications.dto.CreateNotificationRequest;
import com.moodmate.notifications.entity.NotificationType;
import com.moodmate.notifications.repository.NotificationRepository;
import com.moodmate.notifications.scheduling.rules.MoodCheckInReminderRule;
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
 * Phase 1E, Step 4 - the reference implementation of "scheduled job per rule, reading via each
 * service's existing /internal/** pattern" (see MASTER_IMPLEMENTATION_TRACKER.md). Runs every 30
 * minutes; MoodCheckInReminderRule's own 8pm cutoff means every run before then is a cheap no-op
 * (one grouped HTTP call, zero notifications created) - safe to poll this often rather than trying
 * to schedule a single exact-time job, since "past the cutoff" is stable once true for the rest of
 * the day.
 *
 * All time comparisons use UTC explicitly (LocalDate.now(UTC)/LocalTime.now(UTC)) rather than the
 * JVM's default zone, matching every other service's hibernate.jdbc.time_zone: UTC configuration -
 * this deliberately does NOT yet account for a student's actual local time zone or their
 * NotificationPreference quiet hours (moodmate-auth, Phase 1E Step 1); both are known, documented
 * follow-ups in the tracker, not oversights.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MoodReminderScheduledJob {

    private final MoodServiceClient moodServiceClient;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0/30 * * * *")
    public void run() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalTime now = LocalTime.now(ZoneOffset.UTC);
        Instant startOfToday = today.atStartOfDay(ZoneOffset.UTC).toInstant();

        List<UserLastCheckIn> candidates = moodServiceClient.latestCheckInPerUser();
        int created = 0;

        for (UserLastCheckIn candidate : candidates) {
            boolean shouldRemind = MoodCheckInReminderRule.shouldRemind(today, now, candidate.lastCheckInDate());
            if (!shouldRemind) continue;

            // Idempotency: skip if this user already has a MOOD_REMINDER created today, so a run
            // every 30 minutes after 8pm doesn't spam a fresh duplicate each time.
            boolean alreadyRemindedToday = notificationRepository.existsByUserIdAndTypeAndCreatedAtAfter(
                    candidate.userId(), NotificationType.MOOD_REMINDER, startOfToday);
            if (alreadyRemindedToday) continue;

            notificationService.create(new CreateNotificationRequest(
                    candidate.userId(),
                    NotificationType.MOOD_REMINDER,
                    "How are you feeling today?",
                    "You haven't logged a check-in yet today - take a minute for yourself.",
                    "CheckIn",
                    null,
                    null,
                    null
            ));
            created++;
        }

        if (created > 0) {
            log.info("MoodReminderScheduledJob created {} mood reminder(s) out of {} candidate(s)", created, candidates.size());
        }
    }
}
