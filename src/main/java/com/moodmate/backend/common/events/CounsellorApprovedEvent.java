package com.moodmate.backend.common.events;

/**
 * Published when an admin approves a self-serve counsellor request.
 *
 * Lives in {@code common.events} so the support domain (publisher) and the auth domain
 * (listener) can both reference the same class without importing from each other.
 * This is the canonical version — {@code support.CounsellorApprovedEvent} has been removed.
 */
public record CounsellorApprovedEvent(Long userId) {
}
