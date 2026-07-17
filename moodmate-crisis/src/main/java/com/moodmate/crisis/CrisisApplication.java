package com.moodmate.crisis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

// @ConfigurationPropertiesScan added for Feature 9 (Notification Deep Linking) - picks up
// ServiceClientsProperties (used by AuthServiceClient) automatically, same pattern as every other
// service in this project.
@SpringBootApplication
@ConfigurationPropertiesScan
public class CrisisApplication {
    public static void main(String[] args) {
        SpringApplication.run(CrisisApplication.class, args);
    }
}
