package com.moodmate.auth.profile.controller;

import com.moodmate.auth.profile.dto.StudentProfileRequest;
import com.moodmate.auth.profile.dto.StudentProfileResponse;
import com.moodmate.auth.profile.service.StudentProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Phase 1C-i. Split out of UserController (checklist item 1) — keeps each controller focused on
 * one responsibility rather than UserController growing into a "god controller" as more profile
 * types (Peer Mentor, Counsellor, Premium) get added. Route paths are unchanged: still
 * /api/users/me/... — only the code organization changed, not the API surface.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    @GetMapping("/me/student-profile")
    public ResponseEntity<StudentProfileResponse> get(@RequestHeader("X-User-Id") Long userId) {
        return studentProfileService.get(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Partial-update (upsert) - see StudentProfileRequest's doc comment. Always 200, never 201,
    // since the caller doesn't need to know/care whether this created the row or updated it.
    @PutMapping("/me/student-profile")
    public ResponseEntity<StudentProfileResponse> save(@RequestHeader("X-User-Id") Long userId,
                                                         @Valid @RequestBody StudentProfileRequest req) {
        return ResponseEntity.ok(studentProfileService.save(userId, req));
    }
}
