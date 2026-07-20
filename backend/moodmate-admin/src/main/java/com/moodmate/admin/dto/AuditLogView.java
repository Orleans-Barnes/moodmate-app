package com.moodmate.admin.dto;

import java.time.Instant;

public record AuditLogView(Long id, Long adminUserId, String adminName, String action, String targetType,
                            String targetId, String details, Instant createdAt) {
}
