package com.moodmate.backend.admin;

import java.time.Instant;

public record WhitelistEntryResponse(
        Long id,
        String email,
        String notes,
        Instant addedAt
) {
    public static WhitelistEntryResponse from(CounsellorWhitelist entry) {
        return new WhitelistEntryResponse(
                entry.getId(),
                entry.getEmail(),
                entry.getNotes(),
                entry.getAddedAt()
        );
    }
}
