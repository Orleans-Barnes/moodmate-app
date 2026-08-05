package com.moodmate.auth.profile.mapper;

import com.moodmate.auth.profile.dto.NotificationPreferenceResponse;
import com.moodmate.auth.profile.entity.NotificationPreference;

import java.time.format.DateTimeFormatter;

/** Phase 1E, Step 1. Same role as WellnessPreferenceMapper - the only place a
 *  NotificationPreference entity is turned into its DTO. */
public final class NotificationPreferenceMapper {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private NotificationPreferenceMapper() {}

    public static NotificationPreferenceResponse toDto(NotificationPreference p) {
        return new NotificationPreferenceResponse(
                p.isMoodReminders(),
                p.isJournalReminders(),
                p.isHabitReminders(),
                p.isSleepReminders(),
                p.isAppointmentReminders(),
                p.getQuietHoursStart() != null ? p.getQuietHoursStart().format(HH_MM) : null,
                p.getQuietHoursEnd() != null ? p.getQuietHoursEnd().format(HH_MM) : null,
                p.getUpdatedAt()
        );
    }
}
