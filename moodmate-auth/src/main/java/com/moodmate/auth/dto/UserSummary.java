package com.moodmate.auth.dto;

/** Minimal cross-service read of a user's identity - exposed so other services never need direct
 * access to the `users` table or the User entity. Email is included (unlike the monolith's
 * in-process equivalent) because at least one consumer - wallet-service's Paystack checkout -
 * needs it server-side for the receipt/customer record and can no longer read the users table
 * itself. */
public record UserSummary(Long id, String fullName, String avatarEmoji, String email) {
}
