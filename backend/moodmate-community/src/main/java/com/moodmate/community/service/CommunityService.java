package com.moodmate.community.service;

import com.moodmate.community.AnonymousHandleGenerator;
import com.moodmate.community.dto.CommentResponse;
import com.moodmate.community.dto.CreateCommentRequest;
import com.moodmate.community.dto.CreatePostRequest;
import com.moodmate.community.dto.PostResponse;
import com.moodmate.community.dto.ReactResponse;
import com.moodmate.community.dto.ReactionSummaryDto;
import com.moodmate.community.dto.UpdateCommentRequest;
import com.moodmate.community.entity.CommunityPost;
import com.moodmate.community.entity.PostComment;
import com.moodmate.community.entity.PostReaction;
import com.moodmate.community.entity.ReactionType;
import com.moodmate.community.exception.ApiException;
import com.moodmate.community.repository.CommunityPostRepository;
import com.moodmate.community.repository.PostCommentRepository;
import com.moodmate.community.repository.PostReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Ported from the monolith's community.CommunityService. No cross-service calls needed here at
 * all - posts are genuinely anonymous (author name is never shown, only a freshly-generated
 * handle), so unlike support/wellness/wallet this service never needs to reach auth-service.
 * feed() additionally excludes flagged posts, and the admin moderation methods (flagged/flagPost/
 * clearFlag/removePost) are additive - kept from the pre-existing stub, not in the monolith.
 * addComment/listComments/updateComment/deleteComment are new for Feature 6 (Community Comments)
 * - the monolith never had comments at all, so these are genuinely new, not ported. */
@Service
@RequiredArgsConstructor
public class CommunityService {

    private static final String DEFAULT_TOPIC = "GENERAL";

    private final CommunityPostRepository communityPostRepository;
    private final PostReactionRepository postReactionRepository;
    private final PostCommentRepository postCommentRepository;
    private final AnonymousHandleGenerator handleGenerator;

    @Transactional
    public PostResponse createPost(Long authorId, CreatePostRequest request) {
        CommunityPost post = CommunityPost.builder()
                .authorId(authorId)
                .anonymousHandle(handleGenerator.generate())
                .topic(StringUtils.hasText(request.topic()) ? request.topic() : DEFAULT_TOPIC)
                .content(request.content())
                .build();

        post = communityPostRepository.save(post);
        return toResponse(post, List.of(), authorId);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> feed(Long viewerId, String topic, Pageable pageable) {
        Page<CommunityPost> posts = StringUtils.hasText(topic)
                ? communityPostRepository.findByTopicAndFlaggedFalseOrderByCreatedAtDesc(topic, pageable)
                : communityPostRepository.findByFlaggedFalseOrderByCreatedAtDesc(pageable);

        List<Long> postIds = posts.getContent().stream().map(CommunityPost::getId).toList();
        Map<Long, List<PostReaction>> reactionsByPost = postIds.isEmpty()
                ? Map.of()
                : postReactionRepository.findByPostIdIn(postIds).stream()
                        .collect(Collectors.groupingBy(PostReaction::getPostId));

        return posts.map(post -> toResponse(post, reactionsByPost.getOrDefault(post.getId(), List.of()), viewerId));
    }

    /**
     * Reacting again with the SAME type un-reacts (toggle off); reacting with a DIFFERENT type
     * switches it. This matches the schema's "one reaction row per user per post" constraint
     * (post_reactions has a UNIQUE(post_id, user_id) index) - a user can express exactly one
     * reaction per post at a time, not several emoji at once.
     */
    @Transactional
    public ReactResponse react(Long userId, Long postId, ReactionType type) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException("Post not found: " + postId, HttpStatus.NOT_FOUND));

        postReactionRepository.findByPostIdAndUserId(postId, userId).ifPresentOrElse(existing -> {
            if (existing.getReactionType() == type) {
                postReactionRepository.delete(existing);
            } else {
                existing.setReactionType(type);
                postReactionRepository.save(existing);
            }
        }, () -> postReactionRepository.save(PostReaction.builder()
                .postId(postId)
                .userId(userId)
                .reactionType(type)
                .build()));

        List<PostReaction> reactions = postReactionRepository.findByPostId(post.getId());
        return new ReactResponse(summarize(reactions, userId), reactions.size());
    }

    // ── Comments - new for Feature 6, not in the monolith ───────────────────────────────────────

    @Transactional
    public CommentResponse addComment(Long userId, Long postId, CreateCommentRequest request) {
        communityPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException("Post not found: " + postId, HttpStatus.NOT_FOUND));

        if (request.parentCommentId() != null) {
            postCommentRepository.findByIdAndPostId(request.parentCommentId(), postId)
                    .orElseThrow(() -> new ApiException(
                            "Parent comment not found on this post: " + request.parentCommentId(), HttpStatus.NOT_FOUND));
        }

        PostComment comment = PostComment.builder()
                .postId(postId)
                .parentCommentId(request.parentCommentId())
                .authorId(userId)
                .anonymousHandle(handleGenerator.generate())
                .content(request.content())
                .build();

        comment = postCommentRepository.save(comment);
        return toCommentResponse(comment, List.of(), userId);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> listComments(Long postId, Long viewerId, Pageable pageable) {
        communityPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException("Post not found: " + postId, HttpStatus.NOT_FOUND));

        Page<PostComment> topLevel = postCommentRepository
                .findByPostIdAndParentCommentIdIsNullOrderByCreatedAtAsc(postId, pageable);

        List<PostComment> allReplies = postCommentRepository
                .findByPostIdAndParentCommentIdIsNotNullOrderByCreatedAtAsc(postId);
        Map<Long, List<PostComment>> repliesByParent = allReplies.stream()
                .collect(Collectors.groupingBy(PostComment::getParentCommentId));

        return topLevel.map(comment -> toCommentResponse(comment, repliesByParent, viewerId));
    }

    @Transactional
    public CommentResponse updateComment(Long userId, Long commentId, UpdateCommentRequest request) {
        PostComment comment = findComment(commentId);
        if (!comment.getAuthorId().equals(userId)) {
            throw new ApiException("You can only edit your own comment", HttpStatus.FORBIDDEN);
        }
        comment.setContent(request.content());
        comment.setEdited(true);
        comment = postCommentRepository.save(comment);

        // Full subtree (not just direct children) so a re-fetched edit response nests grandchildren
        // too, matching listComments' shape - not just this comment's immediate replies.
        List<PostComment> allReplies = postCommentRepository
                .findByPostIdAndParentCommentIdIsNotNullOrderByCreatedAtAsc(comment.getPostId());
        return toCommentResponse(comment, allReplies, userId);
    }

    /** Author can delete their own comment; ADMIN can delete any (moderation), same authorization
     * shape as removePost below. Deleting a comment cascades to its replies at the DB level
     * (ON DELETE CASCADE on parent_comment_id - see V2 migration), so no orphaned replies remain. */
    @Transactional
    public void deleteComment(Long userId, String role, Long commentId) {
        PostComment comment = findComment(commentId);
        boolean isAuthor = comment.getAuthorId().equals(userId);
        boolean isAdmin = "ADMIN".equals(role);
        if (!isAuthor && !isAdmin) {
            throw new ApiException("You can only delete your own comment", HttpStatus.FORBIDDEN);
        }
        postCommentRepository.deleteById(commentId);
    }

    private PostComment findComment(Long commentId) {
        return postCommentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException("Comment not found: " + commentId, HttpStatus.NOT_FOUND));
    }

    private CommentResponse toCommentResponse(PostComment comment, List<PostComment> directReplies, Long viewerId) {
        Map<Long, List<PostComment>> repliesByParent = directReplies.stream()
                .collect(Collectors.groupingBy(PostComment::getParentCommentId));
        return toCommentResponse(comment, repliesByParent, viewerId);
    }

    private CommentResponse toCommentResponse(PostComment comment, Map<Long, List<PostComment>> repliesByParent, Long viewerId) {
        List<PostComment> children = repliesByParent.getOrDefault(comment.getId(), List.of());
        List<CommentResponse> childResponses = new ArrayList<>(children.size());
        for (PostComment child : children) {
            childResponses.add(toCommentResponse(child, repliesByParent, viewerId));
        }
        boolean mine = viewerId != null && viewerId.equals(comment.getAuthorId());
        return new CommentResponse(comment.getId(), comment.getParentCommentId(), comment.getAnonymousHandle(),
                comment.getContent(), comment.getCreatedAt(), comment.getUpdatedAt(), comment.isEdited(), mine,
                childResponses);
    }

    // ── Admin moderation - additive, not in the monolith ────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PostResponse> listFlagged() {
        return communityPostRepository.findByFlaggedTrue().stream()
                .map(post -> toResponse(post, postReactionRepository.findByPostId(post.getId()), null))
                .toList();
    }

    @Transactional
    public void flagPost(Long postId, String reason) {
        CommunityPost post = findPost(postId);
        post.setFlagged(true);
        post.setFlagReason(reason);
        communityPostRepository.save(post);
    }

    @Transactional
    public void clearFlag(Long postId) {
        CommunityPost post = findPost(postId);
        post.setFlagged(false);
        post.setFlagReason(null);
        communityPostRepository.save(post);
    }

    @Transactional
    public void removePost(Long postId) {
        findPost(postId);
        communityPostRepository.deleteById(postId);
    }

    private CommunityPost findPost(Long postId) {
        return communityPostRepository.findById(postId)
                .orElseThrow(() -> new ApiException("Post not found: " + postId, HttpStatus.NOT_FOUND));
    }

    private PostResponse toResponse(CommunityPost post, List<PostReaction> reactions, Long viewerId) {
        return new PostResponse(post.getId(), post.getAnonymousHandle(), post.getTopic(), post.getContent(),
                post.getCreatedAt(), summarize(reactions, viewerId), reactions.size());
    }

    private List<ReactionSummaryDto> summarize(List<PostReaction> reactions, Long viewerId) {
        Map<ReactionType, List<PostReaction>> byType = reactions.stream()
                .collect(Collectors.groupingBy(PostReaction::getReactionType));

        return Arrays.stream(ReactionType.values())
                .map(type -> {
                    List<PostReaction> forType = byType.getOrDefault(type, List.of());
                    boolean reactedByMe = viewerId != null && forType.stream().anyMatch(r -> r.getUserId().equals(viewerId));
                    return new ReactionSummaryDto(type, type.emoji(), forType.size(), reactedByMe);
                })
                .filter(dto -> dto.count() > 0 || dto.reactedByMe())
                .toList();
    }
}
