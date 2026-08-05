package com.moodmate.support.repository;

import com.moodmate.support.entity.VideoSessionAudit;
import org.springframework.data.jpa.repository.JpaRepository;

/** Phase 1F-B - Repository for video session audit logs. Read-only from application perspective
 * (no update/delete methods) - audit entries are write-once for compliance. */
public interface VideoSessionAuditRepository extends JpaRepository<VideoSessionAudit, Long> {
}
