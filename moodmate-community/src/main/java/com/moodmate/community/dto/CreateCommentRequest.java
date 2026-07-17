package com.moodmate.community.dto;

import jakarta.validation.constraints.NotBlank;

/** parentCommentId null = top-level comment on the post; non-null = a reply to another comment
 * on the same post (validated server-side in CommunityService). */
public record CreateCommentRequest(@NotBlank String content, Long parentCommentId) {
}
