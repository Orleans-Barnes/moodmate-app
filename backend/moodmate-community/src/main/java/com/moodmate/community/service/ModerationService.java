package com.moodmate.community.service;

import com.moodmate.community.client.AuthServiceClient;
import com.moodmate.community.dto.CreateReportRequest;
import com.moodmate.community.dto.ReportResponse;
import com.moodmate.community.entity.CommunityPost;
import com.moodmate.community.entity.ContentReport;
import com.moodmate.community.entity.ContentType;
import com.moodmate.community.entity.PostComment;
import com.moodmate.community.entity.ReportStatus;
import com.moodmate.community.exception.ApiException;
import com.moodmate.community.repository.CommunityPostRepository;
import com.moodmate.community.repository.ContentReportRepository;
import com.moodmate.community.repository.PostCommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

/**
 * New for Feature 7 (Community Moderation) - not in the monolith. Deliberately a separate class
 * from CommunityService rather than folded into it: CommunityService already owns posts/reactions/
 * comments, and this adds a distinct concern (a report queue plus account-level actions that reach
 * out to moodmate-auth) on top of the same repositories, without growing that class further.
 *
 * This is layered on top of, not a replacement for, the pre-existing CommunityPost.flagged/
 * flagPost/clearFlag/removePost admin tools in CommunityService - that ad-hoc single-admin-click
 * flagging still works exactly as before. This class adds a proper user-driven report queue with
 * per-report resolution tracking (who resolved it, when, how) plus the ban/warn actions that
 * pre-existing flagging never had.
 */
@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ContentReportRepository reportRepository;
    private final CommunityPostRepository postRepository;
    private final PostCommentRepository commentRepository;
    private final AuthServiceClient authServiceClient;

    @Transactional
    public ReportResponse reportPost(Long reporterId, Long postId, CreateReportRequest request) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException("Post not found: " + postId, HttpStatus.NOT_FOUND));
        return createReport(reporterId, ContentType.POST, postId, postId, request.reason(),
                post.getContent(), post.getAuthorId());
    }

    @Transactional
    public ReportResponse reportComment(Long reporterId, Long commentId, CreateReportRequest request) {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException("Comment not found: " + commentId, HttpStatus.NOT_FOUND));
        return createReport(reporterId, ContentType.COMMENT, commentId, comment.getPostId(), request.reason(),
                comment.getContent(), comment.getAuthorId());
    }

    private ReportResponse createReport(Long reporterId, ContentType type, Long contentId, Long postId,
                                         String reason, String contentPreview, Long contentAuthorId) {
        if (reportRepository.existsByContentTypeAndContentIdAndReporterId(type, contentId, reporterId)) {
            throw new ApiException("You have already reported this", HttpStatus.CONFLICT);
        }
        ContentReport report = ContentReport.builder()
                .contentType(type)
                .contentId(contentId)
                .postId(postId)
                .reporterId(reporterId)
                .reason(reason)
                .build();
        report = reportRepository.save(report);
        return toResponse(report, contentPreview, contentAuthorId);
    }

    /** Defaults to PENDING when no status is supplied - the normal "what needs my attention" view
     * for an admin opening the queue. */
    @Transactional(readOnly = true)
    public Page<ReportResponse> queue(ReportStatus status, Pageable pageable) {
        ReportStatus effective = status != null ? status : ReportStatus.PENDING;
        return reportRepository.findByStatusOrderByCreatedAtAsc(effective, pageable)
                .map(this::toResponseResolvingContent);
    }

    /** "Approve" = the reported content is fine as-is. Resolves this report AND every other
     * still-PENDING report on the same content item at once, so duplicate reports from different
     * reporters don't keep resurfacing in the queue after one admin decision. */
    @Transactional
    public ReportResponse approve(Long reportId, Long adminId) {
        ContentReport report = findReport(reportId);
        resolveAllPendingForContent(report.getContentType(), report.getContentId(), ReportStatus.DISMISSED, adminId);
        return toResponseResolvingContent(findReport(reportId));
    }

    /** Deletes the underlying post/comment (same hard-delete CommunityService's removePost/
     * deleteComment already perform) and resolves every PENDING report on that content item as
     * CONTENT_REMOVED. Deleting a comment cascades to its replies at the DB level (see Feature 6's
     * V2 migration), same as CommunityService.deleteComment. */
    @Transactional
    public ReportResponse remove(Long reportId, Long adminId) {
        ContentReport report = findReport(reportId);
        if (report.getContentType() == ContentType.POST) {
            postRepository.deleteById(report.getContentId());
        } else {
            commentRepository.deleteById(report.getContentId());
        }
        resolveAllPendingForContent(report.getContentType(), report.getContentId(), ReportStatus.CONTENT_REMOVED, adminId);
        return toResponse(findReport(reportId), null, null);
    }

    /** Bans the reported content's author via AuthServiceClient. Does not itself remove the
     * content or resolve the report - an admin typically calls remove() alongside this (two
     * distinct queue actions), so a ban can also be issued for a pattern of past behavior without
     * necessarily touching the specific reported item. */
    @Transactional(readOnly = true)
    public void banAuthor(Long reportId, String overrideReason) {
        ContentReport report = findReport(reportId);
        Long authorId = resolveContentAuthorId(report);
        String reason = StringUtils.hasText(overrideReason) ? overrideReason : report.getReason();
        authServiceClient.ban(authorId, reason);
    }

    @Transactional(readOnly = true)
    public void warnAuthor(Long reportId, String overrideReason) {
        ContentReport report = findReport(reportId);
        Long authorId = resolveContentAuthorId(report);
        String reason = StringUtils.hasText(overrideReason) ? overrideReason : report.getReason();
        authServiceClient.warn(authorId, reason);
    }

    private void resolveAllPendingForContent(ContentType type, Long contentId, ReportStatus resolution, Long adminId) {
        List<ContentReport> pending = reportRepository
                .findByContentTypeAndContentIdAndStatus(type, contentId, ReportStatus.PENDING);
        Instant now = Instant.now();
        pending.forEach(r -> {
            r.setStatus(resolution);
            r.setResolvedAt(now);
            r.setResolvedBy(adminId);
        });
        reportRepository.saveAll(pending);
    }

    private Long resolveContentAuthorId(ContentReport report) {
        if (report.getContentType() == ContentType.POST) {
            return postRepository.findById(report.getContentId())
                    .map(CommunityPost::getAuthorId)
                    .orElseThrow(() -> new ApiException("Reported post no longer exists", HttpStatus.NOT_FOUND));
        }
        return commentRepository.findById(report.getContentId())
                .map(PostComment::getAuthorId)
                .orElseThrow(() -> new ApiException("Reported comment no longer exists", HttpStatus.NOT_FOUND));
    }

    private ContentReport findReport(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ApiException("Report not found: " + reportId, HttpStatus.NOT_FOUND));
    }

    /** Resolves the current content preview/author at read time - null/null if the content was
     * since deleted (see ReportResponse's doc comment). */
    private ReportResponse toResponseResolvingContent(ContentReport report) {
        if (report.getContentType() == ContentType.POST) {
            return postRepository.findById(report.getContentId())
                    .map(p -> toResponse(report, p.getContent(), p.getAuthorId()))
                    .orElseGet(() -> toResponse(report, null, null));
        }
        return commentRepository.findById(report.getContentId())
                .map(c -> toResponse(report, c.getContent(), c.getAuthorId()))
                .orElseGet(() -> toResponse(report, null, null));
    }

    private ReportResponse toResponse(ContentReport report, String contentPreview, Long contentAuthorId) {
        return new ReportResponse(report.getId(), report.getContentType(), report.getContentId(), report.getPostId(),
                contentPreview, contentAuthorId, report.getReporterId(), report.getReason(), report.getStatus(),
                report.getCreatedAt());
    }
}
