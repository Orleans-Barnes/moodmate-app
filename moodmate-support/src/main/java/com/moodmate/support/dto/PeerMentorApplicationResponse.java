package com.moodmate.support.dto;

import com.moodmate.support.entity.PeerMentorStatus;

/** Fix #4 - mirrors CounsellorRequestResponse. */
public record PeerMentorApplicationResponse(Long id, PeerMentorStatus status) {
}
