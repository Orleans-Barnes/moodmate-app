package com.moodmate.admin.controller;

import com.moodmate.admin.client.RevenueServiceClient;
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
    private final RevenueServiceClient revenueServiceClient;

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

    // Item 8 (Admin Revenue Dashboard) - live read from wallet-service, not cached/stored here.
    @GetMapping("/revenue")
    public RevenueSummaryView revenue(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return revenueServiceClient.getRevenueSummary();
    }

    // Premium & Monetization (Milestone 3) - admin override of a specific user's Pro status,
    // bypassing Paystack entirely (goodwill grants, refund-driven revocations, support workflows).
    @PatchMapping("/users/{userId}/subscription")
    public SubscriptionOverrideView overrideSubscription(@RequestHeader("X-User-Role") String role,
                                                           @RequestHeader("X-User-Id") Long adminUserId,
                                                           @PathVariable Long userId,
                                                           @Valid @RequestBody AdminSubscriptionOverrideRequest request) {
        requireAdmin(role);
        SubscriptionOverrideView result = revenueServiceClient.overrideSubscription(userId, request);
        recordAudit(adminUserId, "OVERRIDE_SUBSCRIPTION", "USER_SUBSCRIPTION", String.valueOf(userId),
                "status=" + request.status() + (request.extendDays() != null ? " extendDays=" + request.extendDays() : ""));
        return result;
    }

    // ── Phase 1H - System Settings: Feature Flags ───────────────────────────────────────────────

    @GetMapping("/feature-flags")
    public List<FeatureFlagView> featureFlags(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return featureFlagService.list();
    }

    // Admin Platform (Milestone 1) - the first real feature-flag *consumer* endpoint. Deliberately
    // no requireAdmin(role) gate: flags govern app-wide behavior for any authenticated user, not
    // just admins. Still lives under /api/admin/** (JwtAuthFilter applies), so a valid token is
    // required, just not an ADMIN one.
    @GetMapping("/feature-flags/public")
    public Map<String, Boolean> publicFeatureFlags() {
        return featureFlagService.publicFlags();
    }

    @PostMapping("/feature-flags")
    @ResponseStatus(HttpStatus.CREATED)
    public FeatureFlagView createFeatureFlag(@RequestHeader("X-User-Role") String role,
                                              @RequestHeader("X-User-Id") Long adminUserId,
                                              @Valid @RequestBody CreateFeatureFlagRequest request) {
        requireAdmin(role);
        FeatureFlagView result = featureFlagService.create(request);
        recordAudit(adminUserId, "CREATE_FEATURE_FLAG", "FEATURE_FLAG", String.valueOf(result.id()), result.flagKey());
        return result;
    }

    @PatchMapping("/feature-flags/{id}")
    public FeatureFlagView setFeatureFlagEnabled(@RequestHeader("X-User-Role") String role,
                                                  @RequestHeader("X-User-Id") Long adminUserId,
                                                  @PathVariable Long id,
                                                  @RequestBody SetFeatureFlagEnabledRequest request) {
        requireAdmin(role);
        FeatureFlagView result = featureFlagService.setEnabled(id, request.enabled());
        recordAudit(adminUserId, request.enabled() ? "ENABLE_FEATURE_FLAG" : "DISABLE_FEATURE_FLAG",
                "FEATURE_FLAG", String.valueOf(id), result.flagKey());
        return result;
    }

    @DeleteMapping("/feature-flags/{id}")
    public void deleteFeatureFlag(@RequestHeader("X-User-Role") String role,
                                   @RequestHeader("X-User-Id") Long adminUserId,
                                   @PathVariable Long id) {
        requireAdmin(role);
        featureFlagService.delete(id);
        recordAudit(adminUserId, "DELETE_FEATURE_FLAG", "FEATURE_FLAG", String.valueOf(id), null);
    }

    // ── Phase 1H - System Settings: Admin Announcement broadcast ───────────────────────────────

    @PostMapping("/announcements")
    public Map<String, Integer> broadcastAnnouncement(@RequestHeader("X-User-Role") String role,
                                                        @RequestHeader("X-User-Id") Long adminUserId,
                                                        @Valid @RequestBody BroadcastAnnouncementRequest request) {
        requireAdmin(role);
        int recipientCount = announcementService.broadcast(request);
        recordAudit(adminUserId, "BROADCAST_ANNOUNCEMENT", "ANNOUNCEMENT", null,
                "Recipients: " + recipientCount + (request.title() != null ? " · " + request.title() : ""));
        return Map.of("recipientCount", recipientCount);
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
                                              @RequestHeader("X-User-Id") Long adminUserId,
                                              @Valid @RequestBody InstitutionInput input) {
        requireAdmin(role);
        InstitutionView result = institutionService.create(input);
        recordAudit(adminUserId, "CREATE_INSTITUTION", "INSTITUTION", String.valueOf(result.id()), result.name());
        return result;
    }

    @PutMapping("/institutions/{id}")
    public InstitutionView institutionUpdate(@RequestHeader("X-User-Role") String role,
                                              @RequestHeader("X-User-Id") Long adminUserId,
                                              @PathVariable Long id,
                                              @Valid @RequestBody InstitutionInput input) {
        requireAdmin(role);
        InstitutionView result = institutionService.update(id, input);
        recordAudit(adminUserId, "EDIT_INSTITUTION", "INSTITUTION", String.valueOf(id), result.name());
        return result;
    }

    @PatchMapping("/institutions/{id}/active")
    public InstitutionView institutionSetActive(@RequestHeader("X-User-Role") String role,
                                                 @RequestHeader("X-User-Id") Long adminUserId,
                                                 @PathVariable Long id,
                                                 @RequestBody SetInstitutionActiveRequest request) {
        requireAdmin(role);
        InstitutionView result = institutionService.setActive(id, request.active());
        recordAudit(adminUserId, request.active() ? "ACTIVATE_INSTITUTION" : "DEACTIVATE_INSTITUTION",
                "INSTITUTION", String.valueOf(id), result.name());
        return result;
    }

    // Institution Management (Milestone 2, Step 2) - first write path for licenseType/
    // licenseExpiry/studentLimit, kept as its own endpoint per UpdateInstitutionLicenseRequest's
    // doc comment.
    @PatchMapping("/institutions/{id}/license")
    public InstitutionView institutionUpdateLicense(@RequestHeader("X-User-Role") String role,
                                                      @RequestHeader("X-User-Id") Long adminUserId,
                                                      @PathVariable Long id,
                                                      @RequestBody UpdateInstitutionLicenseRequest request) {
        requireAdmin(role);
        InstitutionView result = institutionService.updateLicense(id, request);
        recordAudit(adminUserId, "UPDATE_INSTITUTION_LICENSE", "INSTITUTION", String.valueOf(id),
                "type=" + result.licenseType() + " expiry=" + result.licenseExpiry() + " limit=" + result.studentLimit());
        return result;
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    /** All four newly-audited action types (feature flags, announcements, institutions) live in
     * this same service as AuditLogService, so this is a direct in-process call, not an
     * AuditLogServiceClient HTTP call like every other producer uses - no network hop needed when
     * the writer and the audit log are already in the same JVM. */
    private void recordAudit(Long adminUserId, String action, String targetType, String targetId, String details) {
        auditLogService.record(new CreateAuditLogRequest(adminUserId, action, targetType, targetId, details));
    }
}
