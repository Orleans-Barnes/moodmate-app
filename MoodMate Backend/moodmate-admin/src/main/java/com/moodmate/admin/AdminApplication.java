package com.moodmate.admin;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
// @ConfigurationPropertiesScan added Phase 1H (System Settings - Admin Announcement broadcast) -
// picks up ServiceClientsProperties for NotificationsServiceClient, same reason
// moodmate-crisis's CrisisApplication added it for its own AuthServiceClient.
@SpringBootApplication
@ConfigurationPropertiesScan
public class AdminApplication { public static void main(String[] a) { SpringApplication.run(AdminApplication.class, a); } }
