package com.moodmate.support.dto;

import jakarta.validation.constraints.NotNull;

/** Admin-only - see SupportService.linkMentorAccount's doc comment for why account linkage is
 * admin-driven rather than a self-serve request/approve flow like counsellors have. */
public record LinkMentorAccountRequest(@NotNull Long userId) {
}
