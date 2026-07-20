package com.moodmate.gamification.repository;
import com.moodmate.gamification.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    Optional<Achievement> findByKey(String key);
}
