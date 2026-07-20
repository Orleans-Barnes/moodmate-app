package com.moodmate.auth.dto;

/** Minimal cross-service read of a user's primary emergency contact - backs
 * InternalEmergencyContactController, called by moodmate-crisis when a counsellor views a crisis
 * alert's detail. Deliberately narrower than EmergencyContactResponse (no id/notes/timestamps) -
 * another service only ever needs enough to call or reference the contact, not to manage it. */
public record EmergencyContactSummary(String name, String phone, String relationship) {
}
