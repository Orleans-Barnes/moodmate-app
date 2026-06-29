package com.moodmate.backend.community.dto;

import jakarta.validation.constraints.NotBlank;

/** topic is a free-form hashtag-style string (e.g. "exam-season") to match the frontend's
 * filter-chip topics; null/blank falls back to "GENERAL" in the service layer. */
public record CreatePostRequest(@NotBlank String content, String topic) {
}
