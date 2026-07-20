package com.moodmate.admin.controller;

import com.moodmate.admin.dto.*;
import com.moodmate.admin.service.AdminService;
import com.moodmate.admin.service.AnnouncementService;
import com.moodmate.admin.service.AuditLogService;
import com.moodmate.admin.service.FeatureFlagService;
import com.moodmate.admin.service.InstitutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final AdminService service;
    private final FeatureFlagService featureFlagService;
    private final AuditLogService auditLogService;
    private final AnnouncementService announcementService;
    private final InstitutionService institutionService;

    @GetMapping("/stats")
    public AdminStatsResponse stats(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return service.stats();
    }

    @GetMapping("/whitelist")
    public List<WhitelistEntryDto> whitelist(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return service.listWhitelist();
    }

    @PostMapping("/whitelist")
    public WhitelistEntryDto addToWhitelist(@RequestHeader("X-User-Role") String role,
                                             @Valid @RequestBody WhitelistAddRequest request) {
        requireAdmin(role);
        return service.addToWhitelist(request.email(), request.notes());
    }

    @DeleteMapping("/whitelist/{email}")
    public void removeFromWhitelist(@RequestHeader("X-User-Role") String role, @PathVariable String email) {
        requireAdmin(role);
        service.removeFromWhitelist(email);
    }

    @GetMapping("/health-pulse")
    public HealthPulseResponse healthPulse(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return service.healthPulse();
    }

    @GetMapping("/analytics/checkins")
    public List<Map<String,Object>> checkinChart(@RequestHeader("X-User-Role") String role,
                                                  @RequestParam(defaultValue = "30") int days) {
        requireAdmin(role);
        return service.dailyCheckinChart(days);
    }

    @GetMapping("/analytics/moods")
    public List<Map<String,Object>> moodDist(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return service.moodDistribution();
    }

    @GetMapping("/analytics/institutions")
    public List<Map<String,Object>> institutions(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return service.institutionBreakdown();
    }

    // ── Phase 1H - System Settings: Feature Flags ───────────────────────────────────────────────

    @GetMapping("/feature-flags")
    public List<FeatureFlagView> featureFlags(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return featureFlagService.list();
    }

    @PostMapping("/feature-flags")
    @ResponseStatus(HttpStatus.CREATED)
    public FeatureFlagView createFeatureFlag(@RequestHeader("X-User-Role") String role,
                                              @Valid @RequestBody CreateFeatureFlagRequest request) {
        requireAdmin(role);
        return featureFlagService.create(request);
    }

    @PatchMapping("/feature-flags/{id}")
    public FeatureFlagView setFeatureFlagEnabled(@RequestHeader("X-User-Role") String role,
                                                  @PathVariable Long id,
                                                  @RequestBody SetFeatureFlagEnabledRequest request) {
        requireAdmin(role);
        return featureFlagService.setEnabled(id, request.enabled());
    }

    @DeleteMapping("/feature-flags/{id}")
    public void deleteFeatureFlag(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        featureFlagService.delete(id);
    }

    // ── Phase 1H - System Settings: Admin Announcement broadcast ───────────────────────────────

    @PostMapping("/announcements")
    public Map<String, Integer> broadcastAnnouncement(@RequestHeader("X-User-Role") String role,
                                                        @Valid @RequestBody BroadcastAnnouncementRequest request) {
        requireAdmin(role);
        return Map.of("recipientCount", announcementService.broadcast(request));
    }

    // ── Phase 1H - Audit Logs ────────────────────────────────────────────────────────────────────

    @GetMapping("/audit-logs")
    public Page<AuditLogView> auditLogs(@RequestHeader("X-User-Role") String role,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        requireAdmin(role);
        return auditLogService.list(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    // ── Institution Management ──────────────────────────────────────────────────────────────────

    @GetMapping("/institutions")
    public List<InstitutionView> institutionList(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return institutionService.list();
    }

    @GetMapping("/institutions/{id}")
    public InstitutionView institutionGet(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        return institutionService.get(id);
    }

    @PostMapping("/institutions")
    @ResponseStatus(HttpStatus.CREATED)
    public InstitutionView institutionCreate(@RequestHeader("X-User-Role") String role,
                                              @Valid @RequestBody InstitutionInput input) {
        requireAdmin(role);
        return institutionService.create(input);
    }

    @PutMapping("/institutions/{id}")
    public InstitutionView institutionUpdate(@RequestHeader("X-User-Role") String role,
                                              @PathVariable Long id,
                                              @Valid @RequestBody InstitutionInput input) {
        requireAdmin(role);
        return institutionService.update(id, input);
    }

    @PatchMapping("/institutions/{id}/active")
    public InstitutionView institutionSetActive(@RequestHeader("X-User-Role") String role,
                                                 @PathVariable Long id,
                                                 @RequestBody SetInstitutionActiveRequest request) {
        requireAdmin(role);
        return institutionService.setActive(id, request.active());
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}
