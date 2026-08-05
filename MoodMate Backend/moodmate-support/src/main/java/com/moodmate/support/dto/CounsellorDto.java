package com.moodmate.support.dto;

import com.moodmate.support.entity.CounsellorAvailabilityStatus;

import java.util.List;

// Fix #5 - averageRating is null (not 0.0) when ratingCount is 0, so the frontend can distinguish
// "no ratings yet" from "rated zero stars" (which can't even happen - stars is 1-5).
public record CounsellorDto(Long id, String name, String title, String bio, String avatarEmoji,
                             List<String> specialties, boolean available,
                             CounsellorAvailabilityStatus availabilityStatus,
                             Double averageRating, long ratingCount) {
}
