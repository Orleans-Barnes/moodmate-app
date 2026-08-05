package com.moodmate.auth.dto;

import java.time.Instant;

public record EmergencyContactResponse(Long id, String name, String phone, String relationship,
                                        String notes, boolean isPrimary, Instant createdAt, Instant updatedAt) {
}
