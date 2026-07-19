package com.moodmate.support.dto;

/** Phase 1H (Admin Portal - Counsellor Management). Partial update, same convention as
 * UpdateAvailabilityStatusRequest and the notification-preferences endpoints elsewhere in this
 * codebase: a null field means "leave unchanged," so an admin editing just the specialties list
 * doesn't have to resend title/bio/sortOrder too. */
public record AdminEditCounsellorRequest(String title, String bio, String specialties, Integer sortOrder) {
}
