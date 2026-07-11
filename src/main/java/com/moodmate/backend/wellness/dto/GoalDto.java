package com.moodmate.backend.wellness.dto;

public record GoalDto(Long templateId, String key, String label, int xp, boolean done) {
}
