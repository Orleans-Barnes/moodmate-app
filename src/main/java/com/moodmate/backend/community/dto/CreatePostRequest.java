package com.moodmate.backend.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostRequest(
        @NotBlank @Size(max = 2000, message = "Post content must be 2000 characters or fewer") String content,
        @Size(max = 100, message = "Topic must be 100 characters or fewer") String topic
) {
}
