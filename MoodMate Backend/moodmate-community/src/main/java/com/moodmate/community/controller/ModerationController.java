package com.moodmate.community.controller;

import com.moodmate.community.client.AuditLogServiceClient;
import com.moodmate.community.dto.CreateReportRequest;
import com.moodmate.community.dto.ModerationActionRequest;
import com.moodmate.community.dto.ReportResponse;
import com.moodmate.community.entity.ReportStatus;
import com.moodmate.community.service.ModerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** New for Feature 7 (Community Moderation). Report endpoints (POST .../report) are usable by any
 * authenticated user, same as CommunityController's react()/addComment(); everything under
 * /moderation/** requires ADMIN, same X-User-Role gate as CommunityController's own admin section. */
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;
    private final AuditLogServiceClient auditLogServiceClient;

    @PostMapping("/posts/{id}/report")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse reportPost(@RequestHeader("X-User-Id") Long userId,
                                      @PathVariable Long id,
                                      @Valid @RequestBody CreateReportRequest request) {
        return moderationService.reportPost(userId, id, request);
    }

    @PostMapping("/comments/{id}/report")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse reportComment(@RequestHeader("X-User-Id") Long userId,
                                         @PathVariable Long id,
                                         @Valid @RequestBody CreateReportRequest request) {
        return moderationService.reportComment(userId, id, request);
    }

    // ── Admin moderation queue ──────────────────────────────────────────────────────────────────

    @GetMapping("/moderation/queue")
    public Page<ReportResponse> queue(@RequestHeader("X-User-Role") String role,
                                       @RequestParam(required = false) ReportStatus status,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        requireAdmin(role);
        return moderationService.queue(status, PageRequest.of(page, size));
    }

    @PostMapping("/moderation/reports/{id}/approve")
    public ReportResponse approve(@RequestHeader("X-User-Id") Long adminId,
                                   @RequestHeader("X-User-Role") String role,
                                   @PathVariable Long id) {
        requireAdmin(role);
        ReportResponse result = moderationService.approve(id, adminId);
        auditLogServiceClient.record(adminId, "APPROVE_REPORT", "CONTENT_REPORT", String.valueOf(id), null);
        return result;
    }

    @PostMapping("/moderation/reports/{id}/remove")
    public ReportResponse remove(@RequestHeader("X-User-Id") Long adminId,
                                  @RequestHeader("X-User-Role") String role,
                                  @PathVariable Long id) {
        requireAdmin(role);
        ReportResponse result = moderationService.remove(id, adminId);
        auditLogServiceClient.record(adminId, "REMOVE_REPORTED_CONTENT", "CONTENT_REPORT", String.valueOf(id), null);
        return result;
    }

    @PostMapping("/moderation/reports/{id}/ban")
    public ResponseEntity<Void> ban(@RequestHeader("X-User-Id") Long adminId,
                                     @RequestHeader("X-User-Role") String role,
                                     @PathVariable Long id,
                                     @RequestBody(required = false) ModerationActionRequest request) {
        requireAdmin(role);
        moderationService.banAuthor(id, request != null ? request.reason() : null);
        auditLogServiceClient.record(adminId, "BAN_REPORTED_AUTHOR", "CONTENT_REPORT", String.valueOf(id),
                request != null ? request.reason() : null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/moderation/reports/{id}/warn")
    public ResponseEntity<Void> warn(@RequestHeader("X-User-Id") Long adminId,
                                      @RequestHeader("X-User-Role") String role,
                                      @PathVariable Long id,
                                      @RequestBody(required = false) ModerationActionRequest request) {
        requireAdmin(role);
        moderationService.warnAuthor(id, request != null ? request.reason() : null);
        auditLogServiceClient.record(adminId, "WARN_REPORTED_AUTHOR", "CONTENT_REPORT", String.valueOf(id),
                request != null ? request.reason() : null);
        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ADMIN role");
        }
    }
}
