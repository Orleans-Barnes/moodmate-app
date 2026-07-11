package com.moodmate.backend.common.events;

/**
 * Published once a new user (signup or guest) is persisted.
 *
 * Lives in {@code common.events} so the auth domain (publisher) and the wellness domain
 * (listener) can both reference the same class without importing from each other.
 * This is the canonical version — {@code auth.UserRegisteredEvent} has been removed.
 */
public record UserRegisteredEvent(Long userId) {
}
