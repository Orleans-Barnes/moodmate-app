package com.moodmate.auth.profile.controller;

import com.moodmate.auth.profile.dto.WellnessPreferenceRequest;
import com.moodmate.auth.profile.dto.WellnessPreferenceResponse;
import com.moodmate.auth.profile.service.WellnessPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Phase 1C-i. Split out of UserController (checklist item 1) — see StudentProfileController's
 *  doc comment for the reasoning. Route paths unchanged: /api/users/me/wellness-preferences/... */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class WellnessPreferenceController {

    private final WellnessPreferenceService wellnessPreferenceService;

    @GetMapping("/me/wellness-preferences")
    public ResponseEntity<WellnessPreferenceResponse> get(@RequestHeader("X-User-Id") Long userId) {
        return wellnessPreferenceService.get(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/me/wellness-preferences")
    public ResponseEntity<WellnessPreferenceResponse> save(@RequestHeader("X-User-Id") Long userId,
                                                             @Valid @RequestBody WellnessPreferenceRequest req) {
        return ResponseEntity.ok(wellnessPreferenceService.save(userId, req));
    }

    // Explicit action - the only thing that marks onboarding finished. See
    // WellnessPreferenceService's doc comment for why this is separate from plain field saves.
    @PostMapping("/me/wellness-preferences/complete")
    public ResponseEntity<WellnessPreferenceResponse> complete(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(wellnessPreferenceService.complete(userId));
    }

    @PostMapping("/me/wellness-preferences/skip")
    public ResponseEntity<WellnessPreferenceResponse> skip(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(wellnessPreferenceService.skip(userId));
    }

    // Called when the UI actually renders the onboarding prompt, not on every status check - see
    // WellnessPreferenceService.prompted()'s doc comment.
    @PostMapping("/me/wellness-preferences/prompted")
    public ResponseEntity<Void> prompted(@RequestHeader("X-User-Id") Long userId) {
        wellnessPreferenceService.prompted(userId);
        return ResponseEntity.noContent().build();
    }
}
