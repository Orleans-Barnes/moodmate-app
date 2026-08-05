package com.moodmate.notifications.scheduling;

import com.moodmate.notifications.client.JournalServiceClient;
import com.moodmate.notifications.client.dto.UserLastJournalEntry;
import com.moodmate.notifications.dto.CreateNotificationRequest;
import com.moodmate.notifications.entity.NotificationType;
import com.moodmate.notifications.repository.NotificationRepository;
import com.moodmate.notifications.scheduling.rules.JournalReminderRule;
import com.moodmate.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Phase 1E, Step 4 - the second wired scheduled job, same shape as MoodReminderScheduledJob (see
 * that class's doc comment for the shared design rationale). Runs once a day rather than every
 * 30 minutes - JournalReminderRule has no time-of-day cutoff, only a day-count threshold, so
 * there's no benefit to checking more often than once daily.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JournalReminderScheduledJob {

    private final JournalServiceClient journalServiceClient;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *") // once daily at 09:00 UTC
    public void run() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant startOfToday = today.atStartOfDay(ZoneOffset.UTC).toInstant();

        List<UserLastJournalEntry> candidates = journalServiceClient.latestEntryPerUser();
        int created = 0;

        for (UserLastJournalEntry candidate : candidates) {
            if (!JournalReminderRule.shouldRemind(today, candidate.lastEntryDate())) continue;

            boolean alreadyRemindedToday = notificationRepository.existsByUserIdAndTypeAndCreatedAtAfter(
                    candidate.userId(), NotificationType.JOURNAL_REMINDER, startOfToday);
            if (alreadyRemindedToday) continue;

            notificationService.create(new CreateNotificationRequest(
                    candidate.userId(),
                    NotificationType.JOURNAL_REMINDER,
                    "Your journal misses you",
                    "It's been a couple of days - a few lines can help clear your head.",
                    "Journal",
                    null,
                    null,
                    null
            ));
            created++;
        }

        if (created > 0) {
            log.info("JournalReminderScheduledJob created {} journal reminder(s) out of {} candidate(s)", created, candidates.size());
        }
    }
}
