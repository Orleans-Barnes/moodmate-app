package com.moodmate.auth.dto;

/** Institution Management (Milestone 2, Step 3-4) - internal-only read of a user's
 * institution FK, consumed by moodmate-wallet to check institution-license-backed Pro status.
 * institutionId is nullable - "no institution assigned" is a normal state, not an error. */
public record InstitutionIdResponse(Long institutionId) {
}
