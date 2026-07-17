package com.moodmate.community.dto;

import java.time.Instant;
import java.util.List;

public record PostResponse(Long id, String authorHandle, String topic, String content, Instant createdAt,
                            List<ReactionSummaryDto> reactions, long totalReactions) {
}
