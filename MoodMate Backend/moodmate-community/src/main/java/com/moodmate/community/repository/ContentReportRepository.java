package com.moodmate.community.repository;

import com.moodmate.community.entity.ContentReport;
import com.moodmate.community.entity.ContentType;
import com.moodmate.community.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** New for Feature 7 (Community Moderation). */
public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {

    Page<ContentReport> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);

    boolean existsByContentTypeAndContentIdAndReporterId(ContentType contentType, Long contentId, Long reporterId);

    /** Used to resolve every other still-PENDING report for the same content item in one shot when
     * an admin approves/removes - see ModerationService. */
    List<ContentReport> findByContentTypeAndContentIdAndStatus(ContentType contentType, Long contentId, ReportStatus status);
}
