package com.moodmate.admin.controller;

import com.moodmate.admin.dto.*;
import com.moodmate.admin.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController @RequestMapping("/api/admin") @RequiredArgsConstructor
public class AdminController {
    private final AdminService service;

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

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}
