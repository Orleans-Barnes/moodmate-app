package com.moodmate.backend.community.dto;

import com.moodmate.backend.community.ReactionType;

public record ReactionSummaryDto(ReactionType type, String emoji, long count, boolean reactedByMe) {
}
