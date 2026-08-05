package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.GoalCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GoalCompletionRepository extends JpaRepository<GoalCompletion, Long> {
    List<GoalCompletion> findByUserIdAndCompletionDate(Long userId, LocalDate date);

    Optional<GoalCompletion> findByUserIdAndGoalTemplateIdAndCompletionDate(Long userId, Long goalTemplateId,
                                                                             LocalDate date);
}
