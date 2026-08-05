package com.moodmate.admin.controller;

import com.moodmate.admin.dto.CreateAuditLogRequest;
import com.moodmate.admin.service.AuditLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Phase 1H (Admin Portal - Audit Logs). Internal service-to-service endpoint - deliberately NOT
 * registered in moodmate-gateway/application.yml, same convention as every other /internal/**
 * controller in this project (see moodmate-notifications' InternalNotificationController for the
 * canonical doc comment this mirrors). Only reachable by another service calling this one
 * directly on its own port (8099).
 *
 * Every service that performs an admin-gated write this pass becomes a producer here (a new
 * AuditLogServiceClient in each, matching the existing *ServiceClient pattern) rather than each
 * service keeping its own separate audit trail - a fan-in mirrors how moodmate-notifications is
 * the single fan-in for every notification-worthy event across services. */
@RestController
@RequestMapping("/internal/audit-logs")
@RequiredArgsConstructor
public class InternalAuditLogController {

    private final AuditLogService auditLogService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@Valid @RequestBody CreateAuditLogRequest request) {
        auditLogService.record(request);
    }
}
