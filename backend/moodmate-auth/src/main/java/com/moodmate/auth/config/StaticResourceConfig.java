package com.moodmate.auth.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves uploaded avatar files back out over HTTP from local disk. Deliberately unauthenticated
 * (no JwtAuthFilter on this path at the gateway either - see moodmate-gateway/application.yml's
 * /media/** route) since these are just profile photos, already effectively public the moment
 * they're shown anywhere in the community/support UI, and an <Image> tag can't attach a bearer
 * token anyway.
 */
@Configuration
@RequiredArgsConstructor
public class StaticResourceConfig implements WebMvcConfigurer {

    private final AvatarStorageProperties properties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = Paths.get(properties.storageDir()).toAbsolutePath().normalize();
        // dir.toUri() (not string concatenation with "file:") is deliberate - on Windows,
        // "file:" + "C:\foo\bar" is not a valid URI (backslashes, missing leading slash), but
        // Path.toUri() always produces a correct file:/// URI on every OS.
        registry.addResourceHandler("/media/avatars/**")
                .addResourceLocations(dir.toUri().toString());
    }
}
