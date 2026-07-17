package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.HabitCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {

    Optional<HabitCompletion> findByHabitIdAndCompletionDate(Long habitId, LocalDate completionDate);

    Optional<HabitCompletion> findTopByHabitIdAndCompletionDateLessThanOrderByCompletionDateDesc(
            Long habitId, LocalDate completionDate);

    List<HabitCompletion> findByHabitIdAndCompletionDateBetweenOrderByCompletionDateDesc(
            Long habitId, LocalDate from, LocalDate to);

    long countByHabitId(Long habitId);

    long countByHabitIdAndCompletionDateGreaterThanEqual(Long habitId, LocalDate since);

    void deleteByHabitIdAndCompletionDate(Long habitId, LocalDate completionDate);

    /** All completion dates for a habit, oldest first - used to compute the longest-ever streak. */
    List<HabitCompletion> findByHabitIdOrderByCompletionDateAsc(Long habitId);

    /** New for Feature 8 (Mood Analytics) - per-user (not per-habit) range read, backing
     * InternalWellnessController's daily-stats endpoint that moodmate-mood's WellnessServiceClient
     * calls for habit-correlation analytics. */
    List<HabitCompletion> findByUserIdAndCompletionDateBetween(Long userId, LocalDate from, LocalDate to);
}
