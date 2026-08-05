package com.moodmate.support.dto;

import com.moodmate.support.entity.CounsellorStatus;

public record CounsellorRequestResponse(Long id, CounsellorStatus status) {
}
