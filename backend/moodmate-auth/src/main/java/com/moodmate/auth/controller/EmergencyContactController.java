package com.moodmate.auth.controller;

import com.moodmate.auth.dto.CreateEmergencyContactRequest;
import com.moodmate.auth.dto.EmergencyContactResponse;
import com.moodmate.auth.dto.UpdateEmergencyContactRequest;
import com.moodmate.auth.service.EmergencyContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** New for Feature 10 (Emergency Contacts) - fully greenfield, no monolith equivalent. Public,
 * gateway-routed, user-scoped (X-User-Id only - a user only ever manages their own contacts, no
 * counsellor/admin view exists here; see moodmate-crisis's CrisisAlertController for the
 * counsellor-facing read of a user's primary contact instead). */
@RestController
@RequestMapping("/api/emergency-contacts")
@RequiredArgsConstructor
public class EmergencyContactController {

    private final EmergencyContactService service;

    @GetMapping
    public List<EmergencyContactResponse> list(@RequestHeader("X-User-Id") Long userId) {
        return service.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmergencyContactResponse create(@RequestHeader("X-User-Id") Long userId,
                                            @Valid @RequestBody CreateEmergencyContactRequest request) {
        return service.create(userId, request);
    }

    @PutMapping("/{id}")
    public EmergencyContactResponse update(@RequestHeader("X-User-Id") Long userId,
                                            @PathVariable Long id,
                                            @Valid @RequestBody UpdateEmergencyContactRequest request) {
        return service.update(userId, id, request);
    }

    @PostMapping("/{id}/primary")
    public EmergencyContactResponse setPrimary(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return service.setPrimary(userId, id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
