package com.moodmate.backend.support.dto;

import com.moodmate.backend.support.CounsellorStatus;

public record CounsellorRequestResponse(Long id, CounsellorStatus status) {
}
