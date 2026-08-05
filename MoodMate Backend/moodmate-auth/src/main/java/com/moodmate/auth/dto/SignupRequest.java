package com.moodmate.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String fullName,
    String institution,
    // Institution Management (Milestone 2, Step 1) - optional real institution id, sent by
    // SignupScreen's InstitutionPicker (which already resolves a full Institution row, id
    // included) alongside the existing free-text `institution` display string. Not validated
    // against admin-service here (see AuthService#signup's doc comment on this field) - a bad id
    // just leaves the link unusable, same failure mode as a free-text value that never matched.
    Long institutionId
) {}
