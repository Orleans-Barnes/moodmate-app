package com.moodmate.backend.community;

import com.moodmate.backend.common.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.moodmate.backend.community.dto.CreatePostRequest;
import com.moodmate.backend.community.dto.PostResponse;
import com.moodmate.backend.community.dto.ReactResponse;
import com.moodmate.backend.community.dto.ReactionSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private static final String DEFAULT_TOPIC = "GENERAL";

    private final CommunityPostRepository communityPostRepository;
    private final PostReactionRepository postReactionRepository;
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
                ? communityPostRepository.findByTopicOrderByCreatedAtDesc(topic, pageable)
                : communityPostRepository.findAllByOrderByCreatedAtDesc(pageable);

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
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

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

    /**
     * Deletes a post. Only the original author may delete their own post.
     * Returns 403 if the requesting user didn't write it, 404 if it doesn't exist.
     */
    @Transactional
    public void deletePost(Long userId, Long postId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));
        if (!post.getAuthorId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own posts");
        }
        postReactionRepository.deleteByPostId(postId);
        communityPostRepository.delete(post);
    }

    private PostResponse toResponse(CommunityPost post, List<PostReaction> reactions, Long viewerId) {
        return new PostResponse(post.getId(), post.getAnonymousHandle(), post.getTopic(), post.getContent(),
                post.getCreatedAt(), summarize(reactions, viewerId), reactions.size(),
                post.getAuthorId().equals(viewerId));
    }

    private List<ReactionSummaryDto> summarize(List<PostReaction> reactions, Long viewerId) {
        Map<ReactionType, List<PostReaction>> byType = reactions.stream()
                .collect(Collectors.groupingBy(PostReaction::getReactionType));

        return Arrays.stream(ReactionType.values())
                .map(type -> {
                    List<PostReaction> forType = byType.getOrDefault(type, List.of());
                    boolean reactedByMe = forType.stream().anyMatch(r -> r.getUserId().equals(viewerId));
                    return new ReactionSummaryDto(type, type.emoji(), forType.size(), reactedByMe);
                })
                .filter(dto -> dto.count() > 0 || dto.reactedByMe())
                .toList();
    }
}
