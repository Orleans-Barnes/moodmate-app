package com.moodmate.backend.support;

/** Published when an admin approves a self-serve counsellor request. Listened to by the auth
 * domain (see CounsellorRoleGrantor) to promote the user's account to COUNSELLOR. */
public record CounsellorApprovedEvent(Long userId) {
}
