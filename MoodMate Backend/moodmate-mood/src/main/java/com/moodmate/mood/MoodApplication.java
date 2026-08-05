package com.moodmate.mood;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
// @ConfigurationPropertiesScan added for Feature 8 (Mood Analytics) - picks up
// ServiceClientsProperties (used by WellnessServiceClient) automatically, same pattern as every
// other service in this project.
@SpringBootApplication
@ConfigurationPropertiesScan
public class MoodApplication { public static void main(String[] a) { SpringApplication.run(MoodApplication.class, a); } }
