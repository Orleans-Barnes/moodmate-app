package com.moodmate.notifications.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service address(es) for the Phase 1E Step 4 scheduled jobs -
 * same pattern as moodmate-mood/moodmate-wellness/moodmate-ai/moodmate-journal/moodmate-community's
 * ServiceClientsProperties. moodBaseUrl backs MoodServiceClient (the only rule wired end-to-end so
 * far - see MASTER_IMPLEMENTATION_TRACKER.md's Phase 1E Step 4 section). journalBaseUrl/
 * wellnessBaseUrl/supportBaseUrl are added here, ready to use, when JournalReminderRule/
 * HabitReminderRule/AppointmentReminderRule each get their own scheduled job + client. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(
        String moodBaseUrl,
        String journalBaseUrl,
        String wellnessBaseUrl,
        String supportBaseUrl,
        // Phase 1E, Step 5 (Expo Push) - backs AuthServiceClient's notify()/getPreferences() calls.
        String authBaseUrl
) {
}
