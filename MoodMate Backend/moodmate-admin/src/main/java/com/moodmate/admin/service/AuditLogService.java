package com.moodmate.admin.service;

import com.moodmate.admin.dto.AuditLogView;
import com.moodmate.admin.dto.CreateAuditLogRequest;
import com.moodmate.admin.entity.AuditLog;
import com.moodmate.admin.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/** Phase 1H (Admin Portal - Audit Logs). Kept as its own service (not folded into AdminService)
 * since it has a genuinely different write path - every other AdminService write is a real admin
 * user acting through the gateway (X-User-Role checked at the controller), while this one is
 * service-to-service only, called from InternalAuditLogController with no request-scoped admin
 * identity of its own to check. */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final JdbcTemplate jdbc;

    @Transactional
    public void record(CreateAuditLogRequest request) {
        AuditLog log = AuditLog.builder()
                .adminUserId(request.adminUserId())
                .action(request.action())
                .targetType(request.targetType())
                .targetId(request.targetId())
                .details(request.details())
                .build();
        auditLogRepository.save(log);
    }

    /** adminName is resolved via the same cross-schema JdbcTemplate read AdminService already uses
     * elsewhere (see that class's doc comment) - a plain lookup against auth.users by id, not a
     * stored denormalized copy, so a later name change is always reflected. */
    @Transactional(readOnly = true)
    public Page<AuditLogView> list(Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<Long> adminIds = page.getContent().stream().map(AuditLog::getAdminUserId).distinct().toList();
        Map<Long, String> namesById = adminIds.isEmpty() ? Map.of() : resolveAdminNames(adminIds);
        return page.map(l -> new AuditLogView(l.getId(), l.getAdminUserId(),
                namesById.getOrDefault(l.getAdminUserId(), "Unknown admin"),
                l.getAction(), l.getTargetType(), l.getTargetId(), l.getDetails(), l.getCreatedAt()));
    }

    private Map<Long, String> resolveAdminNames(List<Long> adminIds) {
        String placeholders = String.join(",", adminIds.stream().map(String::valueOf).toList());
        return jdbc.queryForList("SELECT id, full_name FROM auth.users WHERE id IN (" + placeholders + ")")
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> ((Number) row.get("id")).longValue(),
                        row -> (String) row.get("full_name")));
    }
}
