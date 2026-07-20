package com.moodmate.auth.controller;

import com.moodmate.auth.dto.EmergencyContactSummary;
import com.moodmate.auth.service.EmergencyContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Service-to-service only, new for Feature 10 (Emergency Contacts) - same internal-only,
 * gateway-unreachable path pattern as InternalUserController/InternalPushController (no
 * /api/emergency-contacts/** gateway route predicate matches /internal/**). Called by
 * moodmate-crisis when a counsellor views a crisis alert's detail. */
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalEmergencyContactController {

    private final EmergencyContactService service;

    /** 204 (no body), not 404, when the user has no primary contact - this is a normal outcome
     * (they may have never added one), not an error condition for the caller to handle specially. */
    @GetMapping("/{userId}/emergency-contacts/primary")
    public ResponseEntity<EmergencyContactSummary> primaryContact(@PathVariable Long userId) {
        EmergencyContactSummary summary = service.getPrimarySummary(userId);
        return summary != null ? ResponseEntity.ok(summary) : ResponseEntity.noContent().build();
    }
}
