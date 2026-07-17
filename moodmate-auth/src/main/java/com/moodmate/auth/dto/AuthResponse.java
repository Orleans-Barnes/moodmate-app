package com.moodmate.auth.dto;

// refreshToken added for Feature 4 (JWT Refresh Tokens) - purely additive to the JSON contract,
// existing clients that don't read this field are unaffected.
public record AuthResponse(String token, UserDto user, String refreshToken) {}
