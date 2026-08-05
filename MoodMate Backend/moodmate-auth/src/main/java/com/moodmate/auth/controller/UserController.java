package com.moodmate.auth.controller;

import com.moodmate.auth.dto.*;
import com.moodmate.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(authService.getProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> update(@RequestHeader("X-User-Id") Long userId,
                                          @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(authService.updateProfile(userId, req));
    }

    // Field name "file" must match the frontend's formData.append('file', ...) in src/api/auth.ts.
    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    public ResponseEntity<UserDto> uploadAvatar(@RequestHeader("X-User-Id") Long userId,
                                                 @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(authService.uploadAvatar(userId, file));
    }

    // Feature 13 (Avatar Management) - explicit removal, distinct from uploadAvatar()'s
    // implicit replace. See AuthService.deleteAvatar()'s doc comment.
    @DeleteMapping("/me/avatar")
    public ResponseEntity<UserDto> deleteAvatar(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(authService.deleteAvatar(userId));
    }

    // Phase 1C-i's academic-profile / wellness-preference / profile-status endpoints live in
    // StudentProfileController, WellnessPreferenceController, and ProfileStatusController
    // (com.moodmate.auth.profile.controller) - kept out of this controller deliberately so it
    // doesn't grow into a "god controller" as Peer Mentor / Counsellor / Premium profiles get
    // added later. All still route under /api/users/me/... - only the code organization split.
}
