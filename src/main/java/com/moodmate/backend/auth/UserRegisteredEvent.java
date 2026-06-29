package com.moodmate.backend.auth;

/**
 * Published once a new user (signup or guest) is persisted. Other domains (wellness, etc.)
 * listen for this instead of auth depending on them directly, so module boundaries stay clean.
 */
public record UserRegisteredEvent(Long userId) {
}
