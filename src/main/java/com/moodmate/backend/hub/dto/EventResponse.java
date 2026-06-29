package com.moodmate.backend.hub.dto;

import java.time.Instant;

public record EventResponse(Long id, String title, String description, Instant startsAt, String location,
                             Integer capacity, long goingCount, boolean rsvped) {
}
