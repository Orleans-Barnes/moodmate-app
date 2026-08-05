package com.moodmate.auth.profile.dto;

import java.time.Instant;

/** DTO-only — never exposes the StudentProfile JPA entity directly. Enum values are surfaced as
 *  plain strings (via StudentProfileMapper), so renaming a Java enum constant is not automatically
 *  a wire-format break as long as the mapper is updated deliberately. */
public record StudentProfileResponse(String programme, String yearOfStudy, Instant updatedAt) {}
