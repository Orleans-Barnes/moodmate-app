package com.moodmate.admin.controller;

import com.moodmate.admin.dto.InstitutionView;
import com.moodmate.admin.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Institution Management (Milestone) - deliberately its own controller, NOT a route on
 * AdminController, because /api/admin/** is entirely behind the gateway's JwtAuthFilter (see
 * moodmate-gateway's application.yml: every admin-service route carries JwtAuthFilter, there is no
 * public path under it). Signup needs this list before the user has a token, so it's routed
 * separately at /api/public/institutions with its own gateway route (institutions-public) that
 * bypasses JwtAuthFilter entirely - same reasoning as SosController's /api/sos/** route in
 * moodmate-support. Active institutions only, alphabetical - matches what a student picking their
 * school during signup should see (deactivated/decommissioned institutions stay hidden here even
 * though an admin can still see/manage them via the authenticated /api/admin/institutions list). */
@RestController
@RequestMapping("/api/public/institutions")
@RequiredArgsConstructor
public class PublicInstitutionController {

    private final InstitutionService institutionService;

    @GetMapping
    public List<InstitutionView> list() {
        return institutionService.listActive();
    }
}
