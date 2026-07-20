package com.moodmate.journal.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;

/**
 * tags is optional and additive (Feature 12) - existing clients that don't send it are
 * unaffected: create() treats a null/absent tags as "no tags", and update() treats it as "leave
 * the entry's current tags untouched" (not "clear them") so an old client editing just the title
 * or body can never silently wipe tags it doesn't know about. To explicitly clear or replace
 * tags, use PUT /api/journal/{id}/tags instead.
 */
public record JournalEntryRequest(String title, @NotBlank String body, String moodEmoji, Set<String> tags) {
}
