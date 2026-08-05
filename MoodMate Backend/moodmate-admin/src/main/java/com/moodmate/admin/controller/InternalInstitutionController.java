package com.moodmate.admin.controller;

import com.moodmate.admin.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Institution Management (Milestone 2, Step 3-4) - internal service-to-service only, same
 * "deliberately unreachable through the gateway" convention as every other Internal*Controller in
 * this project (see moodmate-notifications' InternalNotificationController for the fullest
 * explanation of the pattern). Called by moodmate-wallet's InstitutionServiceClient to check
 * institution-license-backed Pro status. */
@RestController
@RequestMapping("/internal/institutions")
@RequiredArgsConstructor
public class InternalInstitutionController {

    private final InstitutionService institutionService;

    @GetMapping("/{id}/license-active")
    public Map<String, Boolean> licenseActive(@PathVariable Long id) {
        return Map.of("active", institutionService.isLicenseActive(id));
    }
}
