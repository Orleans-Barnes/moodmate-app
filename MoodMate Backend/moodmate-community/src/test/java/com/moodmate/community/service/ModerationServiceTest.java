package com.moodmate.community.service;

import com.moodmate.community.client.AuthServiceClient;
import com.moodmate.community.client.ModerationStatusSummary;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 7's report/queue/approve/remove/ban/warn contract. Same manual mock()
 * construction pattern as CommunityServiceTest. */
class ModerationServiceTest {

    private ContentReportRepository reportRepo;
    private CommunityPostRepository postRepo;
    private PostCommentRepository commentRepo;
    private AuthServiceClient authServiceClient;
    private ModerationService service;

    @BeforeEach
    void setUp() {
        reportRepo = mock(ContentReportRepository.class);
        postRepo = mock(CommunityPostRepository.class);
        commentRepo = mock(PostCommentRepository.class);
        authServiceClient = mock(AuthServiceClient.class);
        service = new ModerationService(reportRepo, postRepo, commentRepo, authServiceClient);
    }

    @Test
    void reportPostCreatesPendingReport() {
        CommunityPost post = CommunityPost.builder().id(1L).authorId(9L).anonymousHandle("Anonymous Owl")
                .topic("GENERAL").content("post content").createdAt(Instant.now()).build();
        when(postRepo.findById(1L)).thenReturn(Optional.of(post));
        when(reportRepo.existsByContentTypeAndContentIdAndReporterId(ContentType.POST, 1L, 5L)).thenReturn(false);
        when(reportRepo.save(any(ContentReport.class))).thenAnswer(inv -> {
            ContentReport r = inv.getArgument(0);
            r.setId(100L);
            r.setCreatedAt(Instant.now());
            return r;
        });

        ReportResponse response = service.reportPost(5L, 1L, new CreateReportRequest("spam"));

        assertEquals(ContentType.POST, response.contentType());
        assertEquals(9L, response.contentAuthorId());
        assertEquals(ReportStatus.PENDING, response.status());
    }

    @Test
    void reportingTheSameContentTwiceByTheSameReporterIsRejected() {
        CommunityPost post = CommunityPost.builder().id(1L).authorId(9L).anonymousHandle("Anonymous Owl")
                .topic("GENERAL").content("post content").createdAt(Instant.now()).build();
        when(postRepo.findById(1L)).thenReturn(Optional.of(post));
        when(reportRepo.existsByContentTypeAndContentIdAndReporterId(ContentType.POST, 1L, 5L)).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class,
                () -> service.reportPost(5L, 1L, new CreateReportRequest("spam")));
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void reportCommentResolvesPostIdFromTheComment() {
        PostComment comment = PostComment.builder().id(2L).postId(1L).authorId(7L)
                .anonymousHandle("Anonymous Fox").content("comment content")
                .createdAt(Instant.now()).updatedAt(Instant.now()).build();
        when(commentRepo.findById(2L)).thenReturn(Optional.of(comment));
        when(reportRepo.existsByContentTypeAndContentIdAndReporterId(ContentType.COMMENT, 2L, 5L)).thenReturn(false);
        when(reportRepo.save(any(ContentReport.class))).thenAnswer(inv -> inv.getArgument(0));

        ReportResponse response = service.reportComment(5L, 2L, new CreateReportRequest("rude"));

        assertEquals(1L, response.postId());
        assertEquals(ContentType.COMMENT, response.contentType());
    }

    @Test
    void queueDefaultsToPendingWhenNoStatusGiven() {
        when(reportRepo.findByStatusOrderByCreatedAtAsc(eq(ReportStatus.PENDING), any()))
                .thenReturn(new PageImpl<>(List.of()));

        Page<ReportResponse> page = service.queue(null, PageRequest.of(0, 20));

        assertEquals(0, page.getContent().size());
        verify(reportRepo).findByStatusOrderByCreatedAtAsc(eq(ReportStatus.PENDING), any());
    }

    @Test
    void approveResolvesEveryPendingReportForTheSameContent() {
        ContentReport target = report(1L, ContentType.POST, 1L, 1L, "spam");
        ContentReport duplicate = report(2L, ContentType.POST, 1L, 1L, "also spam");
        when(reportRepo.findById(1L)).thenReturn(Optional.of(target));
        when(reportRepo.findByContentTypeAndContentIdAndStatus(ContentType.POST, 1L, ReportStatus.PENDING))
                .thenReturn(List.of(target, duplicate));
        when(reportRepo.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        service.approve(1L, 99L);

        assertEquals(ReportStatus.DISMISSED, target.getStatus());
        assertEquals(ReportStatus.DISMISSED, duplicate.getStatus());
        assertEquals(99L, target.getResolvedBy());
    }

    @Test
    void removeDeletesThePostAndResolvesReportsAsContentRemoved() {
        ContentReport report = report(1L, ContentType.POST, 1L, 1L, "spam");
        when(reportRepo.findById(1L)).thenReturn(Optional.of(report));
        when(reportRepo.findByContentTypeAndContentIdAndStatus(ContentType.POST, 1L, ReportStatus.PENDING))
                .thenReturn(List.of(report));
        when(reportRepo.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        service.remove(1L, 99L);

        verify(postRepo).deleteById(1L);
        verify(commentRepo, never()).deleteById(any());
        assertEquals(ReportStatus.CONTENT_REMOVED, report.getStatus());
    }

    @Test
    void banAuthorUsesReportReasonWhenNoOverrideGiven() {
        ContentReport report = report(1L, ContentType.POST, 1L, 1L, "harassment");
        CommunityPost post = CommunityPost.builder().id(1L).authorId(9L).anonymousHandle("Anonymous Owl")
                .topic("GENERAL").content("post content").createdAt(Instant.now()).build();
        when(reportRepo.findById(1L)).thenReturn(Optional.of(report));
        when(postRepo.findById(1L)).thenReturn(Optional.of(post));
        when(authServiceClient.ban(9L, "harassment")).thenReturn(new ModerationStatusSummary(9L, true, "harassment", 0));

        service.banAuthor(1L, null);

        verify(authServiceClient, times(1)).ban(9L, "harassment");
    }

    @Test
    void warnAuthorUsesOverrideReasonWhenGiven() {
        ContentReport report = report(1L, ContentType.COMMENT, 2L, 1L, "rude");
        PostComment comment = PostComment.builder().id(2L).postId(1L).authorId(7L)
                .anonymousHandle("Anonymous Fox").content("comment content")
                .createdAt(Instant.now()).updatedAt(Instant.now()).build();
        when(reportRepo.findById(1L)).thenReturn(Optional.of(report));
        when(commentRepo.findById(2L)).thenReturn(Optional.of(comment));
        when(authServiceClient.warn(7L, "explicit override"))
                .thenReturn(new ModerationStatusSummary(7L, false, null, 1));

        service.warnAuthor(1L, "explicit override");

        verify(authServiceClient).warn(7L, "explicit override");
    }

    private ContentReport report(Long id, ContentType type, Long contentId, Long postId, String reason) {
        return ContentReport.builder().id(id).contentType(type).contentId(contentId).postId(postId)
                .reporterId(5L).reason(reason).status(ReportStatus.PENDING).createdAt(Instant.now()).build();
    }
}
