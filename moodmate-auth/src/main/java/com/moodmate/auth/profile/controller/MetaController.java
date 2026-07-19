package com.moodmate.auth.profile.controller;

import com.moodmate.auth.profile.enums.Challenge;
import com.moodmate.auth.profile.enums.PreferredSupport;
import com.moodmate.auth.profile.enums.Programme;
import com.moodmate.auth.profile.enums.WellnessGoal;
import com.moodmate.auth.profile.enums.YearOfStudy;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Phase 1C-i.6. Single source of truth for "what are the valid enum values" - not because the
 * mobile app needs this today (it has its own frontend catalogues for display labels/grouping),
 * but so an admin portal, web dashboard, or any future integration can read the authoritative
 * list from one place instead of hand-copying/duplicating it out of the Java source. Every route
 * here just returns Enum.values() by name - no business logic, nothing that changes based on the
 * caller, so it's deliberately unauthenticated-friendly in spirit even though it still inherits
 * the same /api/users/** JwtAuthFilter as everything else in this controller family (no separate
 * gateway route was added for it).
 */
@RestController
@RequestMapping("/api/users/meta")
public class MetaController {

    @GetMapping("/programmes")
    public ResponseEntity<List<String>> programmes() {
        return ResponseEntity.ok(names(Programme.values()));
    }

    @GetMapping("/year-of-study")
    public ResponseEntity<List<String>> yearOfStudy() {
        return ResponseEntity.ok(names(YearOfStudy.values()));
    }

    @GetMapping("/goals")
    public ResponseEntity<List<String>> goals() {
        return ResponseEntity.ok(names(WellnessGoal.values()));
    }

    @GetMapping("/challenges")
    public ResponseEntity<List<String>> challenges() {
        return ResponseEntity.ok(names(Challenge.values()));
    }

    @GetMapping("/support-types")
    public ResponseEntity<List<String>> supportTypes() {
        return ResponseEntity.ok(names(PreferredSupport.values()));
    }

    private static List<String> names(Enum<?>[] values) {
        return Arrays.stream(values).map(Enum::name).toList();
    }
}
