package com.moodmate.wellness.dto;

import java.time.Instant;

public record ArticleResponse(Long id, String title, String summary, String body, String category,
                               int readMinutes, String imageEmoji, Instant publishedAt) {
}
