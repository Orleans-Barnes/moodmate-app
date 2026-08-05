package com.moodmate.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateEmergencyContactRequest(@NotBlank @Size(max = 150) String name,
                                             @NotBlank @Size(max = 30) String phone,
                                             @Size(max = 100) String relationship,
                                             @Size(max = 500) String notes,
                                             boolean isPrimary) {
}
