package com.moodmate.crisis.dto;

/** Response for GET /api/crisis/alerts/{id}/emergency-contact - null fields (or the whole object
 * absent, per that endpoint's own contract) mean the alert's user has no primary contact on file,
 * or auth-service couldn't be reached - see AuthServiceClient.getPrimaryEmergencyContact()'s doc
 * comment for why those two cases aren't distinguished. */
public record EmergencyContactResponse(String name, String phone, String relationship) {
}
