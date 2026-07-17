package com.moodmate.support.dto;

/** Exactly one of counsellorId / peerMentorId must be non-null - validated in SupportService. */
public record StartConversationRequest(Long counsellorId, Long peerMentorId) {
}
