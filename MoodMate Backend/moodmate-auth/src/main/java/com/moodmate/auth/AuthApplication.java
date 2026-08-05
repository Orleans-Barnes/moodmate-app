package com.moodmate.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

// PasswordResetProperties (like JwtProperties) is picked up automatically by
// @ConfigurationPropertiesScan below - no separate @EnableConfigurationProperties needed.
@SpringBootApplication
@ConfigurationPropertiesScan
public class AuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}
