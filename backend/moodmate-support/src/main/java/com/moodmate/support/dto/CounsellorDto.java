package com.moodmate.support.dto;

import com.moodmate.support.entity.CounsellorAvailabilityStatus;

import java.util.List;

public record CounsellorDto(Long id, String name, String title, String bio, String avatarEmoji,
                             List<String> specialties, boolean available,
                             CounsellorAvailabilityStatus availabilityStatus) {
}
