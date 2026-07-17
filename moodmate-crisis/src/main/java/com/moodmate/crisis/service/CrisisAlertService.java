package com.moodmate.crisis.service;

import com.moodmate.crisis.client.AuthServiceClient;
import com.moodmate.crisis.client.EmergencyContactSummary;
import com.moodmate.crisis.dto.CreateCrisisAlertRequest;
import com.moodmate.crisis.dto.CrisisAlertDto;
import com.moodmate.crisis.dto.EmergencyContactResponse;
import com.moodmate.crisis.dto.OpenAlertCountResponse;
import com.moodmate.crisis.dto.UpdateCrisisAlertRequest;
import com.moodmate.crisis.entity.CrisisAlert;
import com.moodmate.crisis.entity.CrisisStatus;
import com.moodmate.crisis.exception.ApiException;
import com.moodmate.crisis.repository.CrisisAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CrisisAlertService {

    private final CrisisAlertRepository repository;
    private final AuthServiceClient authServiceClient;

    /** Backs POST /internal/crisis/alerts - not reachable through the gateway (see
     * InternalCrisisAlertController's doc comment). Broadcasts to every ADMIN/COUNSELLOR account
     * (Feature 9's Crisis Alert Routing) right after the alert is durably recorded - the broadcast
     * itself is fire-and-forget (see AuthServiceClient's doc comment), so a push-delivery failure
     * never hides the fact that the alert was still correctly recorded and is visible in the
     * OPEN-alerts queue (GET /api/crisis/alerts) regardless. */
    @Transactional
    public CrisisAlertDto create(CreateCrisisAlertRequest req) {
        CrisisAlert alert = CrisisAlert.builder()
                .userId(req.userId())
                .triggerText(req.triggerText())
                .matchedKeywords(String.join(", ", req.matchedKeywords()))
                .severity(req.severity())
                .source(req.source())
                .build();
        alert = repository.save(alert);

        authServiceClient.notifyRoles(List.of("ADMIN", "COUNSELLOR"), "New crisis alert",
                "A student may need immediate support.",
                Map.of("screen", "CrisisAlerts", "alertId", alert.getId().toString(),
                        "severity", alert.getSeverity().toString()));

        return toDto(alert);
    }

    /** Backs GET /api/crisis/alerts - counsellor view, OPEN alerts only. */
    @Transactional(readOnly = true)
    public List<CrisisAlertDto> listOpen() {
        return repository.findByStatusOrderByCreatedAtDesc(CrisisStatus.OPEN).stream().map(this::toDto).toList();
    }

    /** Backs GET /api/crisis/admin/alerts - admin view, every alert regardless of status. */
    @Transactional(readOnly = true)
    public List<CrisisAlertDto> listAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    /** Backs GET /api/crisis/admin/count - badge count for OPEN alerts. */
    @Transactional(readOnly = true)
    public OpenAlertCountResponse openCount() {
        return new OpenAlertCountResponse(repository.countByStatus(CrisisStatus.OPEN));
    }

    /**
     * Backs POST /api/crisis/alerts/{id}. ACKNOWLEDGE and RESOLVE are both allowed directly from
     * OPEN (a counsellor doesn't have to acknowledge before resolving) - RESOLVE backfills
     * acknowledgedAt/handledByCounsellorId if they weren't already set. Acting on an
     * already-RESOLVED alert is rejected (409) since there's nothing further to do to it; acting
     * on an already-ACKNOWLEDGED alert with ACKNOWLEDGE again is allowed and just re-stamps the
     * handling counsellor (harmless, idempotent-ish).
     */
    @Transactional
    public CrisisAlertDto update(Long alertId, Long counsellorId, UpdateCrisisAlertRequest req) {
        CrisisAlert alert = repository.findById(alertId)
                .orElseThrow(() -> new ApiException("Crisis alert not found: " + alertId, HttpStatus.NOT_FOUND));

        if (alert.getStatus() == CrisisStatus.RESOLVED) {
            throw new ApiException("This alert has already been resolved", HttpStatus.CONFLICT);
        }

        Instant now = Instant.now();
        alert.setHandledByCounsellorId(counsellorId);

        switch (req.action()) {
            case ACKNOWLEDGE -> {
                alert.setStatus(CrisisStatus.ACKNOWLEDGED);
                alert.setAcknowledgedAt(now);
            }
            case RESOLVE -> {
                alert.setStatus(CrisisStatus.RESOLVED);
                if (alert.getAcknowledgedAt() == null) {
                    alert.setAcknowledgedAt(now);
                }
                alert.setResolvedAt(now);
                alert.setResolutionNotes(req.notes());
            }
        }

        return toDto(repository.save(alert));
    }

    /** Backs GET /api/crisis/alerts/{id}/emergency-contact - new for Feature 10 (Emergency
     * Contacts). Deliberately a separate, on-demand endpoint rather than an embedded field on
     * CrisisAlertDto, to avoid an N+1 cross-service call on the alert list endpoints (listOpen/
     * listAll) - a counsellor pulls this up when they open a specific alert's detail, not for
     * every row in a list. */
    @Transactional(readOnly = true)
    public EmergencyContactResponse getEmergencyContact(Long alertId) {
        CrisisAlert alert = repository.findById(alertId)
                .orElseThrow(() -> new ApiException("Crisis alert not found: " + alertId, HttpStatus.NOT_FOUND));

        EmergencyContactSummary summary = authServiceClient.getPrimaryEmergencyContact(alert.getUserId());
        return summary != null
                ? new EmergencyContactResponse(summary.name(), summary.phone(), summary.relationship())
                : new EmergencyContactResponse(null, null, null);
    }

    private CrisisAlertDto toDto(CrisisAlert a) {
        return new CrisisAlertDto(a.getId(), a.getUserId(), a.getTriggerText(), a.getMatchedKeywords(),
                a.getSeverity(), a.getSource(), a.getStatus(), a.getHandledByCounsellorId(),
                a.getResolutionNotes(), a.getCreatedAt(), a.getAcknowledgedAt(), a.getResolvedAt());
    }
}
