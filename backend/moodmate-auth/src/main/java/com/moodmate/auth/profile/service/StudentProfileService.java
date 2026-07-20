package com.moodmate.auth.profile.service;

import com.moodmate.auth.profile.dto.StudentProfileRequest;
import com.moodmate.auth.profile.dto.StudentProfileResponse;
import com.moodmate.auth.profile.entity.StudentProfile;
import com.moodmate.auth.profile.enums.Programme;
import com.moodmate.auth.profile.enums.YearOfStudy;
import com.moodmate.auth.profile.mapper.StudentProfileMapper;
import com.moodmate.auth.profile.repository.StudentProfileRepository;
import com.moodmate.auth.profile.validation.EnumValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Phase 1C-i. Deliberately has no idea signup exists — StudentProfile rows are created lazily,
 * the first time save() is called, never at signup time (see AuthService.signup(), unchanged).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudentProfileService {

    private final StudentProfileRepository repo;

    @Transactional(readOnly = true)
    public Optional<StudentProfileResponse> get(Long userId) {
        return repo.findByUserId(userId).map(StudentProfileMapper::toDto);
    }

    /** Partial-update (upsert-merge): a null field in the request is left untouched, which is
     *  what lets the frontend save "just programme" and "just year" as two independent calls. */
    @Transactional
    public StudentProfileResponse save(Long userId, StudentProfileRequest req) {
        StudentProfile profile = repo.findByUserId(userId)
                .orElseGet(() -> StudentProfile.builder().userId(userId).build());

        if (req.programme() != null) {
            profile.setProgramme(EnumValidator.parse(Programme.class, req.programme(), "programme"));
        }
        if (req.yearOfStudy() != null) {
            profile.setYearOfStudy(EnumValidator.parse(YearOfStudy.class, req.yearOfStudy(), "yearOfStudy"));
        }

        StudentProfileResponse dto = StudentProfileMapper.toDto(repo.save(profile));
        // Audit trail: event + who, never the actual programme/year value - see the equivalent
        // note on WellnessPreferenceService for why field contents stay out of logs.
        log.info("Student profile updated for user {}", userId);
        return dto;
    }
}
