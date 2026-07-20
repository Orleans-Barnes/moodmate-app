package com.moodmate.crisis.client;

/** Local copy of moodmate-auth's EmergencyContactSummary shape - the response body read by
 * AuthServiceClient.getPrimaryEmergencyContact(). New for Feature 10 (Emergency Contacts)'s
 * crisis-service integration. */
public record EmergencyContactSummary(String name, String phone, String relationship) {
}
