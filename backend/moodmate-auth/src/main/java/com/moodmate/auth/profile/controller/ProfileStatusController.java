package com.moodmate.auth.profile.controller;

import com.moodmate.auth.profile.dto.ProfileStatusResponse;
import com.moodmate.auth.profile.service.ProfileCompletionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Phase 1C-i. Split out of UserController (checklist item 1). Route unchanged:
 *  GET /api/users/me/profile-status. */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileStatusController {

    private final ProfileCompletionService profileCompletionService;

    @GetMapping("/me/profile-status")
    public ResponseEntity<ProfileStatusResponse> status(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(profileCompletionService.calculate(userId));
    }
}
