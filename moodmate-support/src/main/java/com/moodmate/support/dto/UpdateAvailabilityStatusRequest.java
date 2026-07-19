package com.moodmate.support.dto;

import com.moodmate.support.entity.CounsellorAvailabilityStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAvailabilityStatusRequest(@NotNull CounsellorAvailabilityStatus availabilityStatus) {
}
