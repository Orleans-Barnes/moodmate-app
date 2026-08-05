package com.moodmate.gamification.service;

import com.moodmate.gamification.entity.Achievement;
import com.moodmate.gamification.entity.Mission;
import com.moodmate.gamification.entity.UserMissionProgress;
import com.moodmate.gamification.exception.ApiException;
import com.moodmate.gamification.repository.AchievementRepository;
import com.moodmate.gamification.repository.MissionRepository;
import com.moodmate.gamification.repository.UserAchievementRepository;
import com.moodmate.gamification.repository.UserMissionProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Feature 17 (Integration Testing) - Part "Services". moodmate-gamification had zero tests before
 * this - a real coverage gap this feature is meant to close, not just add representative examples
 * on top of already-tested code. Same mock() + new ServiceClass(mocks...) convention as every
 * other service test in this project (constructor argument order matches
 * GamificationService's @RequiredArgsConstructor field order).
 */
class GamificationServiceTest {

    private AchievementRepository achievementRepository;
    private UserAchievementRepository userAchievementRepository;
    private MissionRepository missionRepository;
    private UserMissionProgressRepository progressRepository;
    private GamificationService service;

    @BeforeEach
    void setUp() {
        achievementRepository = mock(AchievementRepository.class);
        userAchievementRepository = mock(UserAchievementRepository.class);
        missionRepository = mock(MissionRepository.class);
        progressRepository = mock(UserMissionProgressRepository.class);
        service = new GamificationService(achievementRepository, userAchievementRepository, missionRepository, progressRepository);
    }

    @Test
    void unlockThrowsNotFoundWhenTheAchievementKeyDoesNotExist() {
        when(achievementRepository.findByKey("does-not-exist")).thenReturn(Optional.empty());

        ApiException e = assertThrows(ApiException.class, () -> service.unlock(1L, "does-not-exist"));
        assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, e.getStatus());
        verifyNoInteractions(userAchievementRepository);
    }

    @Test
    void unlockThrowsConflictWhenTheUserAlreadyHasIt() {
        Achievement achievement = Achievement.builder().id(1L).key("first-checkin").title("First Check-In").build();
        when(achievementRepository.findByKey("first-checkin")).thenReturn(Optional.of(achievement));
        when(userAchievementRepository.findByUserIdAndAchievementKey(1L, "first-checkin"))
                .thenReturn(Optional.of(com.moodmate.gamification.entity.UserAchievement.builder().id(9L).build()));

        ApiException e = assertThrows(ApiException.class, () -> service.unlock(1L, "first-checkin"));
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, e.getStatus());
        verify(userAchievementRepository, never()).save(any());
    }

    @Test
    void unlockSavesANewUserAchievementWhenEligible() {
        Achievement achievement = Achievement.builder().id(1L).key("first-checkin").title("First Check-In").build();
        when(achievementRepository.findByKey("first-checkin")).thenReturn(Optional.of(achievement));
        when(userAchievementRepository.findByUserIdAndAchievementKey(1L, "first-checkin")).thenReturn(Optional.empty());
        when(userAchievementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = service.unlock(1L, "first-checkin");

        assertEquals(1L, result.getUserId());
        assertEquals("first-checkin", result.getAchievementKey());
        verify(userAchievementRepository).save(any());
    }

    @Test
    void incrementProgressThrowsNotFoundForAnUnknownMission() {
        when(missionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> service.incrementProgress(1L, 999L, 1));
    }

    @Test
    void incrementProgressMarksCompletedOnceTheTargetIsReached() {
        Mission mission = Mission.builder().id(5L).title("Check in 3 times").targetCount(3).build();
        when(missionRepository.findById(5L)).thenReturn(Optional.of(mission));
        when(progressRepository.findByUserIdAndMissionId(1L, 5L)).thenReturn(Optional.empty());
        when(progressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserMissionProgress result = service.incrementProgress(1L, 5L, 3);

        assertTrue(result.isCompleted());
        assertNotNull(result.getCompletedAt());
    }

    @Test
    void incrementProgressDoesNotGoBackwardsOnceAlreadyCompleted() {
        Mission mission = Mission.builder().id(5L).title("Check in 3 times").targetCount(3).build();
        UserMissionProgress alreadyDone = UserMissionProgress.builder()
                .userId(1L).missionId(5L).progress(3).completed(true).build();
        when(missionRepository.findById(5L)).thenReturn(Optional.of(mission));
        when(progressRepository.findByUserIdAndMissionId(1L, 5L)).thenReturn(Optional.of(alreadyDone));

        UserMissionProgress result = service.incrementProgress(1L, 5L, 1);

        assertSame(alreadyDone, result, "an already-completed mission must be returned unchanged, not re-incremented");
        verify(progressRepository, never()).save(any());
    }

    @Test
    void incrementProgressAccumulatesAcrossMultipleCallsBelowTheTarget() {
        Mission mission = Mission.builder().id(5L).title("Check in 3 times").targetCount(3).build();
        UserMissionProgress inProgress = UserMissionProgress.builder().userId(1L).missionId(5L).progress(1).build();
        when(missionRepository.findById(5L)).thenReturn(Optional.of(mission));
        when(progressRepository.findByUserIdAndMissionId(1L, 5L)).thenReturn(Optional.of(inProgress));
        when(progressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserMissionProgress result = service.incrementProgress(1L, 5L, 1);

        assertEquals(2, result.getProgress());
        assertFalse(result.isCompleted());
    }
}
