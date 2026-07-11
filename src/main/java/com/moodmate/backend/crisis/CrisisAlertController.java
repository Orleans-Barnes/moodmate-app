package com.moodmate.backend.crisis;

import com.moodmate.backend.crisis.dto.CrisisAlertDto;
import com.moodmate.backend.crisis.dto.ResolveAlertRequest;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Crisis alert endpoints.
 *
 * Counsellor routes:
 *   GET  /api/crisis/alerts          — open alerts queue (counsellor sees student userId + text)
 *   POST /api/crisis/alerts/{id}     — acknowledge or resolve an alert
 *
 * Admin routes:
 *   GET  /api/crisis/admin/alerts    — all alerts, all statuses
 *   GET  /api/crisis/admin/count     — count of open alerts (for dashboard badge)
 */
@RestController
@RequestMapping("/api/crisis")
@RequiredArgsConstructor
public class CrisisAlertController {

    private final CrisisAlertService alertService;
    private final CurrentUser        currentUser;

    // ── Counsellor endpoints ──────────────────────────────────────────────────

    @GetMapping("/alerts")
    @PreAuthorize("hasRole('COUNSELLOR')")
    public List<CrisisAlertDto> openAlerts() {
        return alertService.listOpenAlerts();
    }

    @PostMapping("/alerts/{id}")
    @PreAuthorize("hasRole('COUNSELLOR')")
    public CrisisAlertDto updateAlert(
            @PathVariable Long id,
            @Valid @RequestBody ResolveAlertRequest request) {
        return alertService.updateAlert(id, currentUser.id(), request);
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    @GetMapping("/admin/alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CrisisAlertDto> allAlerts() {
        return alertService.listAllAlerts();
    }

    @GetMapping("/admin/count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COUNSELLOR')")
    public Map<String, Long> openCount() {
        return Map.of("open", alertService.countOpenAlerts());
    }
}
