package com.moodmate.gamification.service;

import com.moodmate.gamification.entity.Achievement;
import com.moodmate.gamification.entity.Mission;
import com.moodmate.gamification.entity.UserAchievement;
import com.moodmate.gamification.entity.UserMissionProgress;
import com.moodmate.gamification.exception.ApiException;
import com.moodmate.gamification.repository.AchievementRepository;
import com.moodmate.gamification.repository.MissionRepository;
import com.moodmate.gamification.repository.UserAchievementRepository;
import com.moodmate.gamification.repository.UserMissionProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** No monolith counterpart - this is new functionality (achievements/missions), fully
 * self-contained: it owns all four of its tables outright and never needs to read another
 * service's data, so unlike moodmate-admin there's no cross-schema concern here at all. */
@Service
@RequiredArgsConstructor
public class GamificationService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final MissionRepository missionRepository;
    private final UserMissionProgressRepository progressRepository;

    @Transactional(readOnly = true)
    public List<Achievement> allAchievements() {
        return achievementRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<UserAchievement> myAchievements(Long userId) {
        return userAchievementRepository.findByUserId(userId);
    }

    @Transactional
    public UserAchievement unlock(Long userId, String key) {
        achievementRepository.findByKey(key)
                .orElseThrow(() -> new ApiException("Achievement not found: " + key, HttpStatus.NOT_FOUND));
        if (userAchievementRepository.findByUserIdAndAchievementKey(userId, key).isPresent()) {
            throw new ApiException("Achievement already unlocked: " + key, HttpStatus.CONFLICT);
        }
        return userAchievementRepository.save(UserAchievement.builder()
                .userId(userId)
                .achievementKey(key)
                .build());
    }

    @Transactional(readOnly = true)
    public List<Mission> activeMissions() {
        return missionRepository.findByExpiresOnGreaterThanEqualOrExpiresOnIsNull(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<UserMissionProgress> myProgress(Long userId) {
        return progressRepository.findByUserId(userId);
    }

    @Transactional
    public UserMissionProgress incrementProgress(Long userId, Long missionId, int amount) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ApiException("Mission not found: " + missionId, HttpStatus.NOT_FOUND));

        UserMissionProgress progress = progressRepository.findByUserIdAndMissionId(userId, missionId)
                .orElseGet(() -> UserMissionProgress.builder().userId(userId).missionId(missionId).build());

        if (progress.isCompleted()) {
            return progress;
        }

        progress.setProgress(progress.getProgress() + amount);
        if (progress.getProgress() >= mission.getTargetCount()) {
            progress.setCompleted(true);
            progress.setCompletedAt(Instant.now());
        }
        return progressRepository.save(progress);
    }
}
