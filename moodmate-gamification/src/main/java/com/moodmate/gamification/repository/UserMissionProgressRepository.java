package com.moodmate.gamification.repository;
import com.moodmate.gamification.entity.UserMissionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UserMissionProgressRepository extends JpaRepository<UserMissionProgress, Long> {
    List<UserMissionProgress> findByUserId(Long userId);
    Optional<UserMissionProgress> findByUserIdAndMissionId(Long userId, Long missionId);
}
