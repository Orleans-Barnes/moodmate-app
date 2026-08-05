package com.moodmate.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Body for POST /internal/audit-logs - see InternalAuditLogController's doc comment. `action` is
 * a short, human-scannable verb phrase (e.g. "SUSPEND_USER", "APPROVE_COUNSELLOR") rather than a
 * free-form sentence, so the audit log viewer can filter/group by it later if needed. */
public record CreateAuditLogRequest(@NotNull Long adminUserId, @NotBlank String action,
                                     @NotBlank String targetType, String targetId, String details) {
}
