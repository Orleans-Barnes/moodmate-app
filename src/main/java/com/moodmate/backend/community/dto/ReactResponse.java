package com.moodmate.backend.community.dto;

import java.util.List;

public record ReactResponse(List<ReactionSummaryDto> reactions, long totalReactions) {
}
