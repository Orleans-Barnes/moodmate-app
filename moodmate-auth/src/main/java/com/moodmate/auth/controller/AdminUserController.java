package com.moodmate.auth.controller;

import com.moodmate.auth.dto.AdminUserView;
import com.moodmate.auth.dto.ModerationReasonRequest;
import com.moodmate.auth.dto.ModerationStatusResponse;
import com.moodmate.auth.exception.ApiException;
import com.moodmate.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Phase 1H (Admin Portal - User Management). Deliberately kept under /api/users/** (already
 * gateway-routed to this service with JwtAuthFilter, so X-User-Role is already set) rather than
 * under /api/admin/** - that prefix routes to moodmate-admin, which is a deliberately read-only
 * cross-schema reporting service (see AdminService's class-level doc comment) and must never write
 * to another service's tables. Suspend/reinstate here reuse AuthService.banUser/unbanUser exactly
 * as Feature 7's community-moderation flow does - same action, a second, general-purpose entry
 * point into it. Split out from UserController for the same "don't let it become a god controller"
 * reason StudentProfileController/WellnessPreferenceController were split out. */
@RestController
@RequestMapping("/api/users/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final AuthService authService;

    @GetMapping
    public Page<AdminUserView> search(@RequestHeader("X-User-Role") String role,
                                       @RequestParam(required = false) String query,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        requireAdmin(role);
        return authService.searchUsers(query, PageRequest.of(page, size, Sort.by("id").descending()));
    }

    @PatchMapping("/{userId}/suspend")
    public ModerationStatusResponse suspend(@RequestHeader("X-User-Role") String role,
                                             @PathVariable Long userId,
                                             @RequestBody ModerationReasonRequest request) {
        requireAdmin(role);
        return authService.adminSuspendUser(userId, request.reason());
    }

    @PatchMapping("/{userId}/reinstate")
    public ModerationStatusResponse reinstate(@RequestHeader("X-User-Role") String role,
                                               @PathVariable Long userId) {
        requireAdmin(role);
        return authService.unbanUser(userId);
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ApiException("Admin access required", HttpStatus.FORBIDDEN);
        }
    }
}
