package com.moodmate.community.controller;

import com.moodmate.community.dto.CommentResponse;
import com.moodmate.community.dto.CreateCommentRequest;
import com.moodmate.community.dto.CreatePostRequest;
import com.moodmate.community.dto.PostResponse;
import com.moodmate.community.dto.ReactRequest;
import com.moodmate.community.dto.ReactResponse;
import com.moodmate.community.dto.UpdateCommentRequest;
import com.moodmate.community.service.CommunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Core routes (/api/community/posts, /api/community/posts/{id}/react) match the monolith's
 * CommunityController exactly, using X-User-Id from the gateway instead of CurrentUser (no
 * Spring Security in these services). The /flagged and /posts/{id}/flag admin routes are additive
 * - kept from the pre-existing stub's moderation feature, gated the same way as
 * moodmate-support's admin endpoints (X-User-Role header check). */
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@RequestHeader("X-User-Id") Long userId,
                                @Valid @RequestBody CreatePostRequest request) {
        return communityService.createPost(userId, request);
    }

    @GetMapping("/posts")
    public Page<PostResponse> feed(@RequestHeader("X-User-Id") Long userId,
                                    @RequestParam(required = false) String topic,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        return communityService.feed(userId, topic, PageRequest.of(page, size));
    }

    @PostMapping("/posts/{id}/react")
    public ReactResponse react(@RequestHeader("X-User-Id") Long userId,
                                @PathVariable Long id,
                                @Valid @RequestBody ReactRequest request) {
        return communityService.react(userId, id, request.type());
    }

    // ── Comments - new for Feature 6, not in the monolith ───────────────────────────────────────

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(@RequestHeader("X-User-Id") Long userId,
                                       @PathVariable Long postId,
                                       @Valid @RequestBody CreateCommentRequest request) {
        return communityService.addComment(userId, postId, request);
    }

    @GetMapping("/posts/{postId}/comments")
    public Page<CommentResponse> comments(@RequestHeader("X-User-Id") Long userId,
                                           @PathVariable Long postId,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return communityService.listComments(postId, userId, PageRequest.of(page, size));
    }

    @PutMapping("/comments/{id}")
    public CommentResponse updateComment(@RequestHeader("X-User-Id") Long userId,
                                          @PathVariable Long id,
                                          @Valid @RequestBody UpdateCommentRequest request) {
        return communityService.updateComment(userId, id, request);
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@RequestHeader("X-User-Id") Long userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String role,
                                               @PathVariable Long id) {
        communityService.deleteComment(userId, role, id);
        return ResponseEntity.noContent().build();
    }

    // ── Admin moderation - additive, not in the monolith ────────────────────────────────────────

    @GetMapping("/flagged")
    public List<PostResponse> flagged(@RequestHeader("X-User-Role") String role) {
        requireAdmin(role);
        return communityService.listFlagged();
    }

    @PostMapping("/posts/{id}/flag")
    public ResponseEntity<Void> flag(@RequestHeader("X-User-Role") String role,
                                      @PathVariable Long id,
                                      @RequestParam(required = false) String reason) {
        requireAdmin(role);
        communityService.flagPost(id, reason);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/posts/{id}/flag")
    public ResponseEntity<Void> clearFlag(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        communityService.clearFlag(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        communityService.removePost(id);
        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ADMIN role");
        }
    }
}
