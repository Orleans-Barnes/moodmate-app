package com.moodmate.wellness.dto;

/** Phase 1H (Admin Portal - Wellness Content). Partial update - a null field means "leave
 * unchanged," same convention as AdminEditCounsellorRequest in moodmate-support. */
public record UpdateArticleRequest(String title, String summary, String body, String category,
                                    Integer readMinutes, String imageEmoji) {
}
