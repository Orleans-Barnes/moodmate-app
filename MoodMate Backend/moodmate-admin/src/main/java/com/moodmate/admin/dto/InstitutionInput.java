package com.moodmate.admin.dto;

import jakarta.validation.constraints.NotBlank;

/** Shared shape for both create and update - an institution's editable fields are the same either
 * way, only `active` is excluded (that's its own PATCH endpoint, mirroring FeatureFlag's separate
 * enabled toggle). `type` is validated as a string here and parsed against InstitutionType in the
 * service, so an invalid value comes back as a clean 400 rather than a Jackson deserialization
 * error. */
public record InstitutionInput(@NotBlank String name, @NotBlank String shortName, String city,
                                 @NotBlank String country, @NotBlank String type,
                                 String website, String logoUrl) {
}
