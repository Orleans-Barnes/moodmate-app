package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.DailyGoalTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DailyGoalTemplateRepository extends JpaRepository<DailyGoalTemplate, Long> {
    List<DailyGoalTemplate> findByActiveTrueOrderBySortOrder();

    Optional<DailyGoalTemplate> findByKey(String key);
}
