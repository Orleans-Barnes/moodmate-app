package com.moodmate.wellness.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateHabitRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 10) String icon,
        @Size(max = 20) String color
) {
}
