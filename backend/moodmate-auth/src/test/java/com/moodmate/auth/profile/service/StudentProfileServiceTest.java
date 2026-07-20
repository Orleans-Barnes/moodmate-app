package com.moodmate.auth.profile.service;

import com.moodmate.auth.profile.dto.StudentProfileRequest;
import com.moodmate.auth.profile.dto.StudentProfileResponse;
import com.moodmate.auth.profile.entity.StudentProfile;
import com.moodmate.auth.profile.enums.YearOfStudy;
import com.moodmate.auth.profile.repository.StudentProfileRepository;
import com.moodmate.auth.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Covers Phase 1C-i's partial-update (upsert-merge) contract on StudentProfile, documented on
 *  StudentProfileService.save(). */
class StudentProfileServiceTest {

    private StudentProfileRepository repo;
    private StudentProfileService service;

    @BeforeEach
    void setUp() {
        repo = mock(StudentProfileRepository.class);
        service = new StudentProfileService(repo);
        when(repo.save(any(StudentProfile.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void savingProgrammeOnlyDoesNotClearAlreadySavedYear() {
        StudentProfile existing = StudentProfile.builder()
                .userId(1L).programme(null).yearOfStudy(YearOfStudy.SECOND_YEAR).build();
        when(repo.findByUserId(1L)).thenReturn(Optional.of(existing));

        StudentProfileResponse result = service.save(1L, new StudentProfileRequest("COMPUTER_SCIENCE", null));

        assertEquals("COMPUTER_SCIENCE", result.programme());
        assertEquals("SECOND_YEAR", result.yearOfStudy(), "year must survive a programme-only save");
    }

    @Test
    void firstSaveCreatesRowLazily() {
        when(repo.findByUserId(2L)).thenReturn(Optional.empty());

        StudentProfileResponse result = service.save(2L, new StudentProfileRequest("LAW", "FIRST_YEAR"));

        assertEquals("LAW", result.programme());
        assertEquals("FIRST_YEAR", result.yearOfStudy());
        verify(repo).save(argThat(p -> p.getUserId().equals(2L)));
    }

    @Test
    void invalidProgrammeIsRejectedNotSilentlyStored() {
        when(repo.findByUserId(3L)).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> service.save(3L, new StudentProfileRequest("UNDECLARED_MAJOR", null)));
        assertTrue(ex.getMessage().contains("programme"));
        verify(repo, never()).save(any());
    }

    @Test
    void getReturnsEmptyWhenNoProfileExistsYet() {
        when(repo.findByUserId(4L)).thenReturn(Optional.empty());
        assertTrue(service.get(4L).isEmpty());
    }
}
