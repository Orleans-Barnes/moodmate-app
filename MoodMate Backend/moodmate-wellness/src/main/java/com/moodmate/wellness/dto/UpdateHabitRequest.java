package com.moodmate.wellness.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Renames / re-icons / re-colors a habit only - deliberately cannot touch streak or completion
 * history, which are only ever mutated through the toggle endpoint. */
public record UpdateHabitRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 10) String icon,
        @Size(max = 20) String color
) {
}
