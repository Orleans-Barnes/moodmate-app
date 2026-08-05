package com.moodmate.admin.dto;

import java.time.LocalDate;

/** Institution Management (Milestone 2, Step 2). Partial update, same "null means leave
 * unchanged" convention as AdminEditCounsellorRequest/UpdateArticleRequest elsewhere in this
 * codebase - an admin clearing just the student limit shouldn't have to resend the license type
 * and expiry too. Kept as its own endpoint/DTO rather than folded into the general
 * InstitutionInput (name/city/country/type/website/logoUrl) - same reasoning as `active` already
 * being its own PATCH: licensing is a distinct concern from the institution's directory profile,
 * and will likely gain its own authorization/audit story as the licensing milestone grows
 * (seat consumption, renewal reminders, etc.) that the general profile edit never needs. */
public record UpdateInstitutionLicenseRequest(String licenseType, LocalDate licenseExpiry, Integer studentLimit) {
}
