package com.moodmate.auth.profile.service;

import com.moodmate.auth.profile.dto.ProfileStatusResponse;
import com.moodmate.auth.profile.entity.StudentProfile;
import com.moodmate.auth.profile.entity.WellnessPreference;
import com.moodmate.auth.profile.enums.PreferredSupport;
import com.moodmate.auth.profile.enums.Programme;
import com.moodmate.auth.profile.enums.WellnessGoal;
import com.moodmate.auth.profile.enums.YearOfStudy;
import com.moodmate.auth.profile.repository.StudentProfileRepository;
import com.moodmate.auth.profile.repository.WellnessPreferenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Covers the weighted-completion math and the 7-day skip-reminder cooldown, documented on
 *  ProfileCompletionService. */
class ProfileCompletionServiceTest {

    private StudentProfileRepository studentRepo;
    private WellnessPreferenceRepository wellnessRepo;
    private ProfileCompletionService service;

    @BeforeEach
    void setUp() {
        studentRepo = mock(StudentProfileRepository.class);
        wellnessRepo = mock(WellnessPreferenceRepository.class);
        service = new ProfileCompletionService(studentRepo, wellnessRepo);
        // Unstubbed findByUserId() calls fall through to Mockito's built-in Optional.empty()
        // default (Mockito special-cases Optional-returning methods) - no blanket stub needed.
    }

    @Test
    void emptyProfileIsZeroPercent() {
        ProfileStatusResponse status = service.calculate(1L);
        assertEquals(0, status.profileCompletion());
        assertTrue(status.needsAcademicProfile());
        assertTrue(status.needsGoals());
        assertTrue(status.canShowOnboarding());
    }

    @Test
    void programmeOnlyIsFortyPercent() {
        when(studentRepo.findByUserId(1L)).thenReturn(Optional.of(
                StudentProfile.builder().userId(1L).programme(Programme.LAW).build()));

        assertEquals(40, service.calculate(1L).profileCompletion());
    }

    @Test
    void fullAcademicPlusGoalsIsEightyFivePercent() {
        when(studentRepo.findByUserId(1L)).thenReturn(Optional.of(
                StudentProfile.builder().userId(1L).programme(Programme.LAW).yearOfStudy(YearOfStudy.FIRST_YEAR).build()));
        when(wellnessRepo.findByUserId(1L)).thenReturn(Optional.of(
                WellnessPreference.builder().userId(1L).goals(Set.of(WellnessGoal.LESS_STRESS)).build()));

        // 40 (programme) + 30 (year) + 15 (goals) = 85, preferredSupport still missing.
        assertEquals(85, service.calculate(1L).profileCompletion());
    }

    @Test
    void allFourPiecesIsOneHundredPercent() {
        when(studentRepo.findByUserId(1L)).thenReturn(Optional.of(
                StudentProfile.builder().userId(1L).programme(Programme.LAW).yearOfStudy(YearOfStudy.FIRST_YEAR).build()));
        when(wellnessRepo.findByUserId(1L)).thenReturn(Optional.of(
                WellnessPreference.builder().userId(1L)
                        .goals(Set.of(WellnessGoal.LESS_STRESS))
                        .preferredSupport(Set.of(PreferredSupport.JOURNALING))
                        .build()));

        assertEquals(100, service.calculate(1L).profileCompletion());
    }

    @Test
    void completedOnboardingNeverShowsAgain() {
        when(wellnessRepo.findByUserId(1L)).thenReturn(Optional.of(
                WellnessPreference.builder().userId(1L).completedAt(Instant.now()).build()));

        ProfileStatusResponse status = service.calculate(1L);
        assertFalse(status.needsGoals());
        assertFalse(status.canShowOnboarding());
    }

    @Test
    void skippedRecentlyStaysHiddenUntilCooldownElapses() {
        when(wellnessRepo.findByUserId(1L)).thenReturn(Optional.of(
                WellnessPreference.builder().userId(1L).skippedAt(Instant.now().minus(2, ChronoUnit.DAYS)).build()));

        assertFalse(service.calculate(1L).canShowOnboarding(), "must stay hidden inside the 7-day cooldown");
    }

    @Test
    void skippedOverAWeekAgoCanPromptAgain() {
        when(wellnessRepo.findByUserId(1L)).thenReturn(Optional.of(
                WellnessPreference.builder().userId(1L).skippedAt(Instant.now().minus(8, ChronoUnit.DAYS)).build()));

        assertTrue(service.calculate(1L).canShowOnboarding(), "cooldown must have elapsed after 8 days");
    }
}
