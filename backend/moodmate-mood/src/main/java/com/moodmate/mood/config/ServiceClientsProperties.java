package com.moodmate.mood.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Direct (non-gateway) service-to-service address(es) - same pattern as
 * moodmate-wellness/moodmate-ai/moodmate-journal/moodmate-community's ServiceClientsProperties.
 * wellnessBaseUrl added for Feature 8 (Mood Analytics)'s WellnessServiceClient. */
@ConfigurationProperties(prefix = "moodmate.services")
public record ServiceClientsProperties(String wellnessBaseUrl) {
}
