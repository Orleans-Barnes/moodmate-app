package com.moodmate.mood.dto;

import java.time.LocalDate;
import java.util.List;

public record StressTrendResponse(LocalDate periodStart, LocalDate periodEnd, List<StressTrendPoint> points) {
}
