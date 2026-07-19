package com.moodmate.notifications.client.dto;

import java.time.LocalDate;

/** Mirrors moodmate-mood's dto.UserLastCheckInResponse exactly (GET /internal/mood/latest-per-user) -
 * same "write the client-side type and the source DTO together" rule this project already follows
 * for its frontend API types. */
public record UserLastCheckIn(Long userId, LocalDate lastCheckInDate) {
}
