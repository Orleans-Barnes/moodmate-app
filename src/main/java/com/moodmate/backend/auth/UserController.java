package com.moodmate.backend.auth;

import com.moodmate.backend.auth.dto.UpdateProfileRequest;
import com.moodmate.backend.auth.dto.UserProfileResponse;
import com.moodmate.backend.common.exception.BadRequestException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"
    );
    private static final long MAX_BYTES = 8L * 1024 * 1024; // 8 MB

    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    @Value("${moodmate.uploads.path:./uploads}")
    private String uploadPath;

    @GetMapping
    @Transactional(readOnly = true)
    public UserProfileResponse me() {
        return toProfile(findCurrent());
    }

    @PutMapping
    @Transactional
    public UserProfileResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = findCurrent();
        user.setFullName(request.fullName().trim());
        user.setInstitution(request.institution());
        if (request.avatarEmoji() != null && !request.avatarEmoji().isBlank()) {
            user.setAvatarEmoji(request.avatarEmoji());
        }
        return toProfile(user);
    }

    /**
     * Accepts a multipart image upload and saves it to the local uploads directory.
     * Validates the file by reading its magic bytes (first bytes of the file content),
     * not by trusting the client-supplied Content-Type header which can be spoofed.
     * Deletes the previous avatar file before saving the new one to avoid unbounded disk growth.
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public UserProfileResponse uploadAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException("No file received");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Image must be smaller than 8 MB");
        }

        // Read magic bytes to verify actual file type — never trust client Content-Type
        String detectedType = detectImageType(file);
        if (detectedType == null) {
            throw new BadRequestException("File must be a JPEG, PNG, or WebP image");
        }

        String ext = switch (detectedType) {
            case "image/png"  -> "png";
            case "image/webp" -> "webp";
            default           -> "jpg";
        };

        Path avatarDir = Paths.get(uploadPath, "avatars");
        Files.createDirectories(avatarDir);

        String filename = "user-" + currentUser.id() + "-" + System.currentTimeMillis() + "." + ext;

        // Delete previous avatar file before saving the new one
        User user = findCurrent();
        if (user.getAvatarUrl() != null) {
            String oldFilename = user.getAvatarUrl().replaceFirst("^/api/files/avatars/", "");
            Path oldFile = avatarDir.resolve(oldFilename);
            Files.deleteIfExists(oldFile);
        }

        Files.copy(file.getInputStream(), avatarDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

        user.setAvatarUrl("/api/files/avatars/" + filename);
        return toProfile(user);
    }

    /**
     * Detects image type by reading the first 12 bytes (magic bytes / file signature).
     * Returns the MIME type string, or null if the file is not a recognised image format.
     *
     * Magic byte signatures:
     *   JPEG:  FF D8 FF
     *   PNG:   89 50 4E 47 0D 0A 1A 0A
     *   WebP:  52 49 46 46 ?? ?? ?? ?? 57 45 42 50  (RIFF....WEBP)
     */
    private String detectImageType(MultipartFile file) throws IOException {
        byte[] header = new byte[12];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(header, 0, 12);
            if (read < 3) return null;
        }

        // JPEG
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG
        if (read(header, 0) == 0x89 && read(header, 1) == 0x50 && read(header, 2) == 0x4E
                && read(header, 3) == 0x47 && read(header, 4) == 0x0D && read(header, 5) == 0x0A) {
            return "image/png";
        }
        // WebP (RIFF....WEBP)
        if (read(header, 0) == 0x52 && read(header, 1) == 0x49 && read(header, 2) == 0x46
                && read(header, 3) == 0x46 && header.length >= 12
                && read(header, 8) == 0x57 && read(header, 9) == 0x45
                && read(header, 10) == 0x42 && read(header, 11) == 0x50) {
            return "image/webp";
        }
        return null;
    }

    private int read(byte[] buf, int i) {
        return buf[i] & 0xFF;
    }

    /**
     * Permanently deletes the authenticated user's account and all associated data.
     * The cascade is handled at the database level (ON DELETE CASCADE on all foreign keys
     * referencing the users table). Returns 204 No Content on success.
     *
     * Note: the wellness_profiles row holds leaf_balance and tree data; the cascade
     * removes it automatically along with goal_completions, journal_entries, mood_logs, etc.
     */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteAccount() {
        User user = findCurrent();
        // Remove avatar file from disk if present
        if (user.getAvatarUrl() != null) {
            try {
                String filename = user.getAvatarUrl().replaceFirst("^/api/files/avatars/", "");
                Path oldFile = Paths.get(uploadPath, "avatars", filename);
                Files.deleteIfExists(oldFile);
            } catch (IOException ignored) {
                // Best-effort — don't block account deletion if file removal fails
            }
        }
        userRepository.delete(user);
    }

    private User findCurrent() {
        return userRepository.findById(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(
                user.getId(), user.getEmail(), user.getFullName(),
                user.getInstitution(), user.getAvatarEmoji(), user.getAvatarUrl(),
                user.isGuest(), user.getRole()
        );
    }
}
