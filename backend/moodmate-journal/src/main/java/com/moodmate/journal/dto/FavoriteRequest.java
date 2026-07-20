package com.moodmate.journal.dto;

/** Feature 12 (Favorites). Deliberately explicit ({"favorite": true|false}) rather than a
 * toggle-on-POST endpoint, so a retried request is idempotent and the caller always knows the
 * resulting state without needing the response body. */
public record FavoriteRequest(boolean favorite) {
}
