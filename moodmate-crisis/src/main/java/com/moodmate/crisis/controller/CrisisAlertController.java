package com.moodmate.crisis.controller;

import com.moodmate.crisis.dto.CrisisAlertDto;
import com.moodmate.crisis.dto.EmergencyContactResponse;
import com.moodmate.crisis.dto.OpenAlertCountResponse;
import com.moodmate.crisis.dto.UpdateCrisisAlertRequest;
import com.moodmate.crisis.exception.ApiException;
import com.moodmate.crisis.service.CrisisAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/** Public, gateway-routed endpoints - see moodmate-gateway/application.yml's crisis-service
 * route. Everything here requires a COUNSELLOR or ADMIN role except the two admin-only endpoints. */
@RestController
@RequestMapping("/api/crisis")
@RequiredArgsConstructor
public class CrisisAlertController {

    private static final Set<String> COUNSELLOR_OR_ADMIN = Set.of("COUNSELLOR", "ADMIN");

    private final CrisisAlertService service;

    @GetMapping("/alerts")
    public List<CrisisAlertDto> listOpen(@RequestHeader("X-User-Role") String role) {
        requireRole(role, COUNSELLOR_OR_ADMIN);
        return service.listOpen();
    }

    @PostMapping("/alerts/{id}")
    public CrisisAlertDto update(@RequestHeader("X-User-Id") Long counsellorId,
                                  @RequestHeader("X-User-Role") String role,
                                  @PathVariable Long id,
                                  @Valid @RequestBody UpdateCrisisAlertRequest req) {
        requireRole(role, COUNSELLOR_OR_ADMIN);
        return service.update(id, counsellorId, req);
    }

    @GetMapping("/admin/count")
    public OpenAlertCountResponse openCount(@RequestHeader("X-User-Role") String role) {
        requireRole(role, COUNSELLOR_OR_ADMIN);
        return service.openCount();
    }

    @GetMapping("/admin/alerts")
    public List<CrisisAlertDto> listAll(@RequestHeader("X-User-Role") String role) {
        requireRole(role, Set.of("ADMIN"));
        return service.listAll();
    }

    /** New for Feature 10 (Emergency Contacts) - on-demand lookup for a specific alert's detail
     * view, not embedded in the list responses above (see CrisisAlertService.getEmergencyContact's
     * doc comment for why). */
    @GetMapping("/alerts/{id}/emergency-contact")
    public EmergencyContactResponse emergencyContact(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireRole(role, COUNSELLOR_OR_ADMIN);
        return service.getEmergencyContact(id);
    }

    private void requireRole(String role, Set<String> allowed) {
        if (!allowed.contains(role)) {
            throw new ApiException("This action requires one of: " + allowed, HttpStatus.FORBIDDEN);
        }
    }
}
