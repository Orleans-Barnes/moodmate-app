package com.moodmate.mood.dto;

import com.moodmate.mood.entity.Emotion;

import java.time.LocalDate;

public record DailyMoodStatResponse(LocalDate date, double avgStress, double avgEnergy,
                                     int checkinCount, Emotion dominantEmotion) {
}
