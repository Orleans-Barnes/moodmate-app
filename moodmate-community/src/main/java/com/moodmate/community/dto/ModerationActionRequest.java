package com.moodmate.community.dto;

/** Body for the ban/warn moderation actions - reason is optional; when blank, ModerationService
 * falls back to the report's own stored reason so an admin isn't forced to retype it. */
public record ModerationActionRequest(String reason) {
}
