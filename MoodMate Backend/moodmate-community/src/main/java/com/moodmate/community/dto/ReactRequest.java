package com.moodmate.community.dto;

import com.moodmate.community.entity.ReactionType;
import jakarta.validation.constraints.NotNull;

public record ReactRequest(@NotNull ReactionType type) {
}
