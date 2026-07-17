package com.moodmate.auth.service;

import com.moodmate.auth.config.AvatarStorageProperties;
import com.moodmate.auth.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Local-disk avatar storage (chosen over S3/cloud storage for this project - see the
 * moodmate-crisis/moodmate-ai credential discussion for the same "what's actually available"
 * reasoning). Files are written under moodmate.avatar.storage-dir and served back out by
 * StaticResourceConfig's /media/avatars/** handler, fronted by the gateway's /media/** route
 * (see moodmate-gateway/application.yml) so the URL this returns is reachable from the phone.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AvatarStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/heic", "image/heif");
    private static final long MAX_BYTES = 5L * 1024 * 1024; // 5 MB - matches multipart config below

    private final AvatarStorageProperties properties;

    public String store(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("No file uploaded", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException("Avatar image must be 5MB or smaller", HttpStatus.BAD_REQUEST);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException("Avatar must be a JPEG, PNG, WEBP, or HEIC image", HttpStatus.BAD_REQUEST);
        }

        try {
            Path dir = Paths.get(properties.storageDir()).toAbsolutePath().normalize();
            Files.createDirectories(dir);

            String extension = switch (contentType.toLowerCase()) {
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                case "image/heic" -> ".heic";
                case "image/heif" -> ".heif";
                default -> ".jpg";
            };
            // UUID filename, deliberately ignoring the client-supplied original filename entirely
            // (never trust it - path traversal / weird characters) and namespacing by user id so
            // stale files are at least traceable to an account for manual cleanup.
            String filename = userId + "_" + UUID.randomUUID() + extension;
            Path target = dir.resolve(filename).normalize();
            if (!target.getParent().equals(dir)) {
                // Defense in depth - shouldn't be reachable given the filename is server-generated.
                throw new ApiException("Invalid file", HttpStatus.BAD_REQUEST);
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String base = properties.publicBaseUrl().replaceAll("/+$", "");
            return base + "/media/avatars/" + filename;
        } catch (IOException e) {
            log.error("Failed to store avatar for user {}", userId, e);
            throw new ApiException("Failed to save avatar image", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Best-effort cleanup of the previous avatar file when a user re-uploads. Never throws. */
    public void deleteQuietly(String previousAvatarUrl) {
        if (previousAvatarUrl == null || previousAvatarUrl.isBlank()) {
            return;
        }
        try {
            String filename = previousAvatarUrl.substring(previousAvatarUrl.lastIndexOf('/') + 1);
            Path dir = Paths.get(properties.storageDir()).toAbsolutePath().normalize();
            Path target = dir.resolve(filename).normalize();
            if (target.getParent().equals(dir)) {
                Files.deleteIfExists(target);
            }
        } catch (Exception e) {
            log.warn("Could not delete previous avatar file for url {}: {}", previousAvatarUrl, e.getMessage());
        }
    }
}
