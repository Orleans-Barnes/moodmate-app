package com.moodmate.backend.habits;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {
    List<HabitCompletion> findByUserIdAndCompletedOnBetweenOrderByCompletedOnDesc(Long userId, LocalDate from, LocalDate to);
    Optional<HabitCompletion> findByHabitIdAndCompletedOn(Long habitId, LocalDate date);
    void deleteByHabitIdAndCompletedOn(Long habitId, LocalDate date);
    @Query("SELECT COUNT(c) FROM HabitCompletion c WHERE c.habitId = :habitId AND c.completedOn BETWEEN :from AND :to")
    long countCompletions(Long habitId, LocalDate from, LocalDate to);
}
