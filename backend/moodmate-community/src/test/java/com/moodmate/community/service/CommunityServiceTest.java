package com.moodmate.community.service;

import com.moodmate.community.AnonymousHandleGenerator;
import com.moodmate.community.dto.CommentResponse;
import com.moodmate.community.dto.CreateCommentRequest;
import com.moodmate.community.dto.UpdateCommentRequest;
import com.moodmate.community.entity.CommunityPost;
import com.moodmate.community.entity.PostComment;
import com.moodmate.community.exception.ApiException;
import com.moodmate.community.repository.CommunityPostRepository;
import com.moodmate.community.repository.PostCommentRepository;
import com.moodmate.community.repository.PostReactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 6 (Community Comments): add/list/update/delete, nested-reply tree building,
 * and author-vs-admin delete authorization. Uses the same manual mock() + constructor-injection
 * pattern as AiChatServiceTest/JournalServiceTest/AuthServiceRefreshTokenTest, not
 * @ExtendWith(MockitoExtension.class). */
class CommunityServiceTest {

    private CommunityPostRepository postRepo;
    private PostReactionRepository reactionRepo;
    private PostCommentRepository commentRepo;
    private AnonymousHandleGenerator handleGenerator;
    private CommunityService service;

    @BeforeEach
    void setUp() {
        postRepo = mock(CommunityPostRepository.class);
        reactionRepo = mock(PostReactionRepository.class);
        commentRepo = mock(PostCommentRepository.class);
        handleGenerator = mock(AnonymousHandleGenerator.class);
        service = new CommunityService(postRepo, reactionRepo, commentRepo, handleGenerator);
    }

    @Test
    void addCommentSavesTopLevelCommentWhenParentIsNull() {
        when(postRepo.findById(1L)).thenReturn(Optional.of(post(1L)));
        when(handleGenerator.generate()).thenReturn("Anonymous Otter");
        when(commentRepo.save(any(PostComment.class))).thenAnswer(inv -> {
            PostComment c = inv.getArgument(0);
            c.setId(10L);
            c.setCreatedAt(Instant.now());
            c.setUpdatedAt(Instant.now());
            return c;
        });

        CommentResponse response = service.addComment(5L, 1L, new CreateCommentRequest("Hang in there!", null));

        assertEquals(10L, response.id());
        assertEquals("Anonymous Otter", response.authorHandle());
        assertTrue(response.mine());
        assertTrue(response.replies().isEmpty());
        verify(commentRepo).save(any(PostComment.class));
    }

    @Test
    void addCommentRejectsUnknownPost() {
        when(postRepo.findById(99L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> service.addComment(5L, 99L, new CreateCommentRequest("hi", null)));
        assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void addCommentRejectsParentFromAnotherPost() {
        when(postRepo.findById(1L)).thenReturn(Optional.of(post(1L)));
        when(commentRepo.findByIdAndPostId(50L, 1L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> service.addComment(5L, 1L, new CreateCommentRequest("reply", 50L)));
        assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void listCommentsNestsRepliesUnderTheirParent() {
        when(postRepo.findById(1L)).thenReturn(Optional.of(post(1L)));

        PostComment top = comment(1L, 1L, null, 7L, "Anonymous Fox", "root comment");
        PostComment reply = comment(2L, 1L, 1L, 8L, "Anonymous Wren", "a reply");

        when(commentRepo.findByPostIdAndParentCommentIdIsNullOrderByCreatedAtAsc(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of(top)));
        when(commentRepo.findByPostIdAndParentCommentIdIsNotNullOrderByCreatedAtAsc(1L))
                .thenReturn(List.of(reply));

        Page<CommentResponse> page = service.listComments(1L, 7L, PageRequest.of(0, 20));

        assertEquals(1, page.getContent().size());
        CommentResponse rootResponse = page.getContent().get(0);
        assertEquals(1L, rootResponse.id());
        assertTrue(rootResponse.mine());
        assertEquals(1, rootResponse.replies().size());
        assertEquals(2L, rootResponse.replies().get(0).id());
        assertFalse(rootResponse.replies().get(0).mine());
    }

    @Test
    void updateCommentAllowsOnlyTheAuthor() {
        PostComment existing = comment(1L, 1L, null, 7L, "Anonymous Fox", "original");
        when(commentRepo.findById(1L)).thenReturn(Optional.of(existing));

        ApiException ex = assertThrows(ApiException.class,
                () -> service.updateComment(99L, 1L, new UpdateCommentRequest("edited")));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void updateCommentByAuthorMarksEdited() {
        PostComment existing = comment(1L, 1L, null, 7L, "Anonymous Fox", "original");
        when(commentRepo.findById(1L)).thenReturn(Optional.of(existing));
        when(commentRepo.save(any(PostComment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(commentRepo.findByPostIdAndParentCommentIdIsNotNullOrderByCreatedAtAsc(1L)).thenReturn(List.of());

        CommentResponse response = service.updateComment(7L, 1L, new UpdateCommentRequest("edited content"));

        assertEquals("edited content", response.content());
        assertTrue(response.edited());
    }

    @Test
    void deleteCommentAllowsAuthor() {
        PostComment existing = comment(1L, 1L, null, 7L, "Anonymous Fox", "content");
        when(commentRepo.findById(1L)).thenReturn(Optional.of(existing));

        service.deleteComment(7L, "USER", 1L);

        verify(commentRepo).deleteById(1L);
    }

    @Test
    void deleteCommentAllowsAdminEvenIfNotAuthor() {
        PostComment existing = comment(1L, 1L, null, 7L, "Anonymous Fox", "content");
        when(commentRepo.findById(1L)).thenReturn(Optional.of(existing));

        service.deleteComment(999L, "ADMIN", 1L);

        verify(commentRepo).deleteById(1L);
    }

    @Test
    void deleteCommentRejectsNonAuthorNonAdmin() {
        PostComment existing = comment(1L, 1L, null, 7L, "Anonymous Fox", "content");
        when(commentRepo.findById(1L)).thenReturn(Optional.of(existing));

        ApiException ex = assertThrows(ApiException.class,
                () -> service.deleteComment(999L, "USER", 1L));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
    }

    private CommunityPost post(Long id) {
        return CommunityPost.builder().id(id).authorId(1L).anonymousHandle("Anonymous Owl")
                .topic("GENERAL").content("post content").createdAt(Instant.now()).build();
    }

    private PostComment comment(Long id, Long postId, Long parentId, Long authorId, String handle, String content) {
        return PostComment.builder().id(id).postId(postId).parentCommentId(parentId).authorId(authorId)
                .anonymousHandle(handle).content(content).createdAt(Instant.now()).updatedAt(Instant.now())
                .edited(false).build();
    }
}
