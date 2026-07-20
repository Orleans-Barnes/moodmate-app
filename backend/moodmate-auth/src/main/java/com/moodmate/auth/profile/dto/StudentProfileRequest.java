package com.moodmate.auth.profile.dto;

import jakarta.validation.constraints.Size;

/**
 * Phase 1C-i. Both fields nullable by design — partial-update (upsert-merge) semantics, matching
 * the existing UpdateProfileRequest pattern: a null field means "don't touch this field", not
 * "clear it". This is what lets the frontend save the Programme screen and the Year screen as
 * two separate calls (per the reviewed "save after every screen" requirement) without either
 * call disturbing the other's already-saved value. Values are enum names (e.g. "COMPUTER_SCIENCE")
 * — see Programme.java / YearOfStudy.java for the valid set; an unrecognized value is rejected
 * with 400, not silently stored.
 *
 * Phase 1C-i.5 hardening note: deliberately NOT @NotNull on either field. Bean Validation's
 * @NotNull would reject the exact "save just one field" calls this whole partial-update design
 * exists to support, reintroducing the "signup blocked by missing profile data" problem the
 * architecture review explicitly ruled out. @Size caps the input length as a defensive bound
 * (real enum names top out well under this) without constraining which fields must be present.
 */
public record StudentProfileRequest(
    @Size(max = 40) String programme,
    @Size(max = 20) String yearOfStudy
) {}
