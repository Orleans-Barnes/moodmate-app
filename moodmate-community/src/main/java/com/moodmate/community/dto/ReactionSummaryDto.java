package com.moodmate.community.dto;

import com.moodmate.community.entity.ReactionType;

public record ReactionSummaryDto(ReactionType type, String emoji, long count, boolean reactedByMe) {
}
