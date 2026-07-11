package com.moodmate.backend.community.dto;

import com.moodmate.backend.community.ReactionType;
import jakarta.validation.constraints.NotNull;

public record ReactRequest(@NotNull ReactionType type) {
}
