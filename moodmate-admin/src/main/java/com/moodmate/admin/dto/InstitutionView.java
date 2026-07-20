package com.moodmate.admin.dto;

import java.time.Instant;
import java.time.LocalDate;

public record InstitutionView(Long id, String name, String shortName, String city, String country,
                                String type, boolean active, String website, String logoUrl,
                                String licenseType, LocalDate licenseExpiry, Integer studentLimit,
                                Instant createdAt, Instant updatedAt) {
}
