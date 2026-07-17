package com.moodmate.community;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
// @ConfigurationPropertiesScan added for Feature 7 (Community Moderation) - picks up
// ServiceClientsProperties (used by AuthServiceClient) automatically, same pattern as every other
// service in this project.
@SpringBootApplication
@ConfigurationPropertiesScan
public class CommunityApplication { public static void main(String[] a) { SpringApplication.run(CommunityApplication.class, a); } }
