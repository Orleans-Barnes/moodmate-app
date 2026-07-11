package com.moodmate.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves uploaded user files (avatars, etc.) from the local uploads directory
 * at /api/files/**  — no JWT required (configured in SecurityConfig's PUBLIC_ENDPOINTS).
 *
 * The path resolves relative to the working directory of the Spring Boot process,
 * which is the project root when running with `mvn spring-boot:run`.
 * Override via UPLOADS_PATH env var for a different location.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${moodmate.uploads.path:./uploads}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Normalise to an absolute "file:" URI so Spring can locate the directory
        // regardless of whether the user passed a relative or absolute path.
        String location = uploadPath;
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        if (!location.startsWith("file:") && !location.startsWith("classpath:")) {
            location = "file:" + location;
        }

        registry.addResourceHandler("/api/files/**")
                .addResourceLocations(location)
                .setCachePeriod(3600); // 1-hour browser cache for avatars
    }
}
