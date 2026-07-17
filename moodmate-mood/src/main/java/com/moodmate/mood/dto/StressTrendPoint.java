package com.moodmate.mood.dto;

import java.time.LocalDate;

public record StressTrendPoint(LocalDate date, double avgStress) {
}
