package com.moodmate.backend.admin;

import com.moodmate.backend.auth.Role;
import com.moodmate.backend.auth.UserRepository;
import com.moodmate.backend.community.CommunityPostRepository;
import com.moodmate.backend.common.exception.ConflictException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.support.AppointmentRepository;
import com.moodmate.backend.support.CounsellorRepository;
import com.moodmate.backend.support.CounsellorStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin-only endpoints for platform management.
 * All routes require ROLE_ADMIN JWT claim.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository                 userRepository;
    private final CounsellorRepository           counsellorRepository;
    private final AppointmentRepository          appointmentRepository;
    private final CommunityPostRepository        communityPostRepository;
    private final CounsellorWhitelistRepository  whitelistRepository;

    /**
     * GET /api/admin/stats
     * Returns platform-wide counts for the admin dashboard.
     */
    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        long totalStudents    = userRepository.countByRoleAndGuestFalse(Role.STUDENT);
        long totalCounsellors = userRepository.countByRoleAndGuestFalse(Role.COUNSELLOR);
        long totalAppts       = appointmentRepository.count();
        long pendingRequests  = counsellorRepository.countByStatus(CounsellorStatus.PENDING);
        long totalPosts       = communityPostRepository.count();

        return new AdminStatsResponse(
                totalStudents,
                totalCounsellors,
                totalAppts,
                pendingRequests,
                totalPosts
        );
    }

    // ── Counsellor Whitelist ──────────────────────────────────────────────────

    /**
     * GET /api/admin/whitelist
     * Returns all approved counsellor email addresses.
     */
    @GetMapping("/whitelist")
    @Transactional(readOnly = true)
    public List<WhitelistEntryResponse> getWhitelist() {
        return whitelistRepository.findAll().stream()
                .map(WhitelistEntryResponse::from)
                .toList();
    }

    /**
     * POST /api/admin/whitelist
     * Adds an email to the counsellor whitelist.
     * On their next login the user's role will be auto-promoted to COUNSELLOR.
     *
     * Handles TOCTOU: if two concurrent requests race past the existsByEmail check,
     * the DB unique constraint fires and we translate it to 409 instead of 500.
     */
    @PostMapping("/whitelist")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public WhitelistEntryResponse addToWhitelist(@Valid @RequestBody WhitelistEntryRequest request) {
        String email = request.email().trim().toLowerCase();
        if (whitelistRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already in the counsellor whitelist");
        }
        try {
            CounsellorWhitelist entry = whitelistRepository.saveAndFlush(
                    CounsellorWhitelist.builder()
                            .email(email)
                            .notes(request.notes() != null && !request.notes().isBlank() ? request.notes().trim() : null)
                            .build()
            );
            return WhitelistEntryResponse.from(entry);
        } catch (DataIntegrityViolationException ex) {
            // Race condition: another request inserted the same email between our check and save
            throw new ConflictException("Email is already in the counsellor whitelist");
        }
    }

    /**
     * DELETE /api/admin/whitelist/{email}
     * Removes an email from the whitelist. Returns 404 if not found.
     * The user keeps their current DB role; the gate fires on their next login.
     */
    @DeleteMapping("/whitelist/{email}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void removeFromWhitelist(@PathVariable String email) {
        String normalised = email.trim().toLowerCase();
        if (!whitelistRepository.existsByEmail(normalised)) {
            throw new ResourceNotFoundException("Email not found in whitelist: " + normalised);
        }
        whitelistRepository.deleteByEmail(normalised);
    }
}
