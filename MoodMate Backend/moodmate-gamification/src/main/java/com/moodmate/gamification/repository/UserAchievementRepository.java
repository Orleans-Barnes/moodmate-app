package com.moodmate.gamification.repository;
import com.moodmate.gamification.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    List<UserAchievement> findByUserId(Long userId);
    Optional<UserAchievement> findByUserIdAndAchievementKey(Long userId, String key);
}
