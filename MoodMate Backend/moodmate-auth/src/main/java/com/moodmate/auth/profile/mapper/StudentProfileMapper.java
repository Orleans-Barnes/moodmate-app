package com.moodmate.auth.profile.mapper;

import com.moodmate.auth.profile.dto.StudentProfileResponse;
import com.moodmate.auth.profile.entity.StudentProfile;

/**
 * Phase 1C-i. The only place a StudentProfile entity is converted to its wire-format DTO —
 * StudentProfileService and StudentProfileController never build a StudentProfileResponse by
 * hand, so the entity itself is never accidentally serialized/returned directly (checklist item
 * "don't return enums/entities directly").
 */
public final class StudentProfileMapper {

    private StudentProfileMapper() {}

    public static StudentProfileResponse toDto(StudentProfile p) {
        return new StudentProfileResponse(
                p.getProgramme() != null ? p.getProgramme().name() : null,
                p.getYearOfStudy() != null ? p.getYearOfStudy().name() : null,
                p.getUpdatedAt()
        );
    }
}
