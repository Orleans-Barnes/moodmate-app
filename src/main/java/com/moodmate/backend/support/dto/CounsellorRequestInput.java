package com.moodmate.backend.support.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for a self-serve "become a counsellor" request. Name and avatar are pulled from the
 * requesting user's own profile, not asked for again here. */
public record CounsellorRequestInput(@NotBlank String title, @NotBlank String bio, String specialties) {
}
