package com.moodmate.community.dto;

import java.time.Instant;
import java.util.List;

/** mine indicates whether the requesting viewer authored this comment (drives whether the client
 * shows edit/delete controls) - same "viewer-relative" shape as PostResponse's reactions
 * (reactedByMe). replies nests direct children recursively, built in-memory by
 * CommunityService from one flat query per post rather than N+1 queries or recursive SQL. */
public record CommentResponse(Long id, Long parentCommentId, String authorHandle, String content,
                               Instant createdAt, Instant updatedAt, boolean edited, boolean mine,
                               List<CommentResponse> replies) {
}
