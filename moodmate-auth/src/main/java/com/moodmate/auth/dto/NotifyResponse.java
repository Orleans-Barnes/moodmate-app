package com.moodmate.auth.dto;

/** sent=false with a reason (e.g. "no registered device") is a normal, expected outcome - not an
 * error - for a user who has never opened the app on a device with push permissions granted. */
public record NotifyResponse(boolean sent, int deviceCount, String reason) {
}
