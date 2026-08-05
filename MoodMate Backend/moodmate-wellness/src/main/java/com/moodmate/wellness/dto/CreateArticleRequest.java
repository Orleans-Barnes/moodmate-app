package com.moodmate.wellness.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** Phase 1H (Admin Portal - Wellness Content). publishedAt is set server-side to now() at
 * creation - an admin publishing an article means "publish it now," not backdating/scheduling,
 * which this pass deliberately doesn't build (no scheduling UI exists anywhere else in the admin
 * portal either). */
public record CreateArticleRequest(@NotBlank String title, String summary, @NotBlank String body,
                                    @NotBlank String category, @Min(1) int readMinutes, @NotBlank String imageEmoji) {
}
