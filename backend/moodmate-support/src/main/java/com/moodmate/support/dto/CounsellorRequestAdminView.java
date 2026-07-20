package com.moodmate.support.dto;

import com.moodmate.support.entity.CounsellorStatus;

/** What an admin sees when reviewing a pending counsellor request. */
public record CounsellorRequestAdminView(Long id, Long userId, String name, String title, String bio,
                                          String specialties, CounsellorStatus status) {
}
