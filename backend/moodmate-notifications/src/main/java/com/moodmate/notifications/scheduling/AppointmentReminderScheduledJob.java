package com.moodmate.notifications.scheduling;

import com.moodmate.notifications.client.SupportServiceClient;
import com.moodmate.notifications.client.dto.ConfirmedAppointment;
import com.moodmate.notifications.dto.CreateNotificationRequest;
import com.moodmate.notifications.entity.NotificationType;
import com.moodmate.notifications.repository.NotificationRepository;
import com.moodmate.notifications.scheduling.rules.AppointmentReminderRule;
import com.moodmate.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Phase 1E, Step 4 - the fourth wired scheduled job, same shape as MoodReminderScheduledJob (see
 * that class's doc comment for the shared design rationale). Runs every 30 minutes -
 * AppointmentReminderRule's 24h window is date/time-specific per appointment (not a single daily
 * cutoff like the other three rules), so this can't be reduced to "one run a day."
 *
 * Idempotency caveat (documented, not an oversight): unlike the daily rules above, this guards
 * against re-reminding for the SAME appointment by checking for an existing APPOINTMENT_REMINDER
 * created since that appointment's own 24h window opened (scheduledAt minus 24h), not "since
 * midnight." This is correct as long as a single user's confirmed appointments don't have
 * overlapping 24h windows - two confirmed appointments for one user within 24h of each other could
 * see the second one skipped. Rare in practice (one counsellor relationship, appointments
 * typically at most weekly), but a real limitation worth knowing about before this ships more
 * broadly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentReminderScheduledJob {

    private final SupportServiceClient supportServiceClient;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0/30 * * * *")
    public void run() {
        Instant now = Instant.now();
        List<ConfirmedAppointment> candidates = supportServiceClient.confirmedAppointments();
        int created = 0;

        for (ConfirmedAppointment candidate : candidates) {
            if (!AppointmentReminderRule.shouldRemind(now, candidate.scheduledAt())) continue;

            Instant windowOpenedAt = candidate.scheduledAt().minus(AppointmentReminderRule.REMINDER_WINDOW);
            boolean alreadyReminded = notificationRepository.existsByUserIdAndTypeAndCreatedAtAfter(
                    candidate.userId(), NotificationType.APPOINTMENT_REMINDER, windowOpenedAt);
            if (alreadyReminded) continue;

            notificationService.create(new CreateNotificationRequest(
                    candidate.userId(),
                    NotificationType.APPOINTMENT_REMINDER,
                    "Upcoming counsellor session",
                    "You have a confirmed session coming up soon - see you there.",
                    "Support",
                    null,
                    null,
                    null
            ));
            created++;
        }

        if (created > 0) {
            log.info("AppointmentReminderScheduledJob created {} appointment reminder(s) out of {} candidate(s)", created, candidates.size());
        }
    }
}
