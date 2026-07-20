package com.moodmate.notifications;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;
// @ConfigurationPropertiesScan picks up ServiceClientsProperties (used by MoodServiceClient),
// same pattern as moodmate-mood's own MoodApplication. @EnableScheduling turns on
// MoodReminderScheduledJob's @Scheduled method - Phase 1E, Step 4.
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class NotificationsApplication { public static void main(String[] a) { SpringApplication.run(NotificationsApplication.class, a); } }
