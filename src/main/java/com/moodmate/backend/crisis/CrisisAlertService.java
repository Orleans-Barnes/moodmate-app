package com.moodmate.backend.crisis;

import com.moodmate.backend.crisis.dto.CrisisAlertAction;
import com.moodmate.backend.crisis.dto.CrisisAlertDto;
import com.moodmate.backend.crisis.dto.ResolveAlertRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrisisAlertService {

    private final CrisisAlertRepository alertRepository;
    private final CrisisKeywordDetector detector;

    /**
     * Analyses free text for crisis signals and, if found, persists a CrisisAlert.
     * Deduplication: skips if this user already has an OPEN alert created within the last hour.
     *
     * @param userId  the student who wrote the text
     * @param text    raw message or journal content
     * @param source  where the text came from (AI_CHAT or JOURNAL)
     */
    @Transactional
    public void analyseAndFlag(Long userId, String text, CrisisSource source) {
        CrisisKeywordDetector.DetectionResult result = detector.analyse(text);
        if (!result.detected()) return;

        // Dedup — don't spam counsellors with duplicate alerts per session
        if (alertRepository.hasRecentOpenAlert(userId)) {
            log.debug("Crisis alert dedup: userId={} already has a recent open alert", userId);
            return;
        }

        // Truncate trigger text to 500 chars for storage
        String snippet = text.length() > 500 ? text.substring(0, 500) : text;
        String keywords = String.join(", ", result.matchedPhrases());

        CrisisAlert alert = CrisisAlert.builder()
                .userId(userId)
                .triggerText(snippet)
                .matchedKeywords(keywords)
                .severity(result.severity())
                .source(source)
                .build();

        alertRepository.save(alert);

        log.warn("CRISIS ALERT [{}] created for userId={} | keywords: {} | source: {}",
                result.severity(), userId, keywords, source);
    }

    /** All OPEN alerts — primary counsellor queue. */
    public List<CrisisAlertDto> listOpenAlerts() {
        return alertRepository.findByStatusOrderByCreatedAtDesc(CrisisStatus.OPEN)
                .stream().map(CrisisAlertDto::from).toList();
    }

    /** All alerts (any status) — admin oversight view. */
    public List<CrisisAlertDto> listAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(CrisisAlertDto::from).toList();
    }

    /** Alerts for a specific student — used when a counsellor opens a student's profile. */
    public List<CrisisAlertDto> listAlertsForUser(Long userId) {
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(CrisisAlertDto::from).toList();
    }

    /** Count of currently OPEN alerts — for dashboard badges. */
    public long countOpenAlerts() {
        return alertRepository.countByStatus(CrisisStatus.OPEN);
    }

    /**
     * Counsellor acknowledges or resolves an alert.
     *
     * @param alertId       the alert to update
     * @param counsellorId  the counsellor taking action
     * @param request       action + optional resolution notes
     */
    @Transactional
    public CrisisAlertDto updateAlert(Long alertId, Long counsellorId, ResolveAlertRequest request) {
        CrisisAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));

        alert.setHandledByCounsellorId(counsellorId);

        if (request.action() == CrisisAlertAction.ACKNOWLEDGE) {
            alert.setStatus(CrisisStatus.ACKNOWLEDGED);
            alert.setAcknowledgedAt(Instant.now());
        } else {
            alert.setStatus(CrisisStatus.RESOLVED);
            alert.setResolvedAt(Instant.now());
            if (alert.getAcknowledgedAt() == null) alert.setAcknowledgedAt(Instant.now());
            if (request.notes() != null) alert.setResolutionNotes(request.notes());
        }

        return CrisisAlertDto.from(alertRepository.save(alert));
    }
}
