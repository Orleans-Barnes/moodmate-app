package com.moodmate.support.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for a self-serve "become a peer mentor" application - Fix #4. Mirrors
 * CounsellorRequestInput's shape: name/avatar are pulled from the requesting user's own profile
 * (via AuthServiceClient), not asked for again here. PeerMentor has no "title" field like
 * Counsellor does, so this only asks for bio and focusArea. */
public record PeerMentorApplicationInput(@NotBlank String bio, String focusArea) {
}
