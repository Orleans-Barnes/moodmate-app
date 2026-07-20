package com.moodmate.journal.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

/** Feature 12 (Tags). Replaces the entry's full tag set (not an add/remove delta) - send the
 * complete desired list each time. An empty set clears all tags; use FavoriteRequest's null-vs-
 * empty distinction as a contrast: tags here has no "leave untouched" mode of its own, since this
 * endpoint's whole purpose is setting tags explicitly (JournalEntryRequest.tags is the
 * leave-untouched-if-absent path for create/update). */
public record UpdateTagsRequest(@NotNull Set<String> tags) {
}
