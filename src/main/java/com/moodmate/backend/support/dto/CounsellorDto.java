package com.moodmate.backend.support.dto;

import java.util.List;

public record CounsellorDto(Long id, String name, String title, String bio, String avatarEmoji,
                             List<String> specialties, boolean available) {
}
