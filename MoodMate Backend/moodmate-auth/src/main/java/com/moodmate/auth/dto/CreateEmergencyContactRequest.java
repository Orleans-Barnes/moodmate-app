package com.moodmate.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** relationship/notes are free text (e.g. "Mother", "Roommate", "Family doctor") - deliberately
 * not an enum, since the set of real-world relationships is open-ended. isPrimary is a request,
 * not a guarantee: the very first contact a user adds always becomes primary regardless of this
 * flag (see EmergencyContactService.create()'s doc comment), and setting it true on a later
 * contact unsets whichever one was primary before. */
public record CreateEmergencyContactRequest(@NotBlank @Size(max = 150) String name,
                                             @NotBlank @Size(max = 30) String phone,
                                             @Size(max = 100) String relationship,
                                             @Size(max = 500) String notes,
                                             boolean isPrimary) {
}
