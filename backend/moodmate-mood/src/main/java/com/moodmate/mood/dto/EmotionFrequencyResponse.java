package com.moodmate.mood.dto;

import com.moodmate.mood.entity.Emotion;

import java.util.List;

public record EmotionFrequencyResponse(int totalCheckins, List<EmotionCount> frequencies) {
    public record EmotionCount(Emotion emotion, long count) {
    }
}
