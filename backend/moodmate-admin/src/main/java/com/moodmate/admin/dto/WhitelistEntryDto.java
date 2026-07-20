package com.moodmate.admin.dto;

import java.time.Instant;

public record WhitelistEntryDto(Long id, String email, String notes, Instant addedAt) {
}
