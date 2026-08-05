package com.moodmate.support.dto;

import jakarta.validation.constraints.NotNull;

public record RequestMentorRequest(@NotNull Long peerMentorId, String message) {
}
