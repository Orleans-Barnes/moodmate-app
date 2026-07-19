package com.moodmate.wellness.repository;

import com.moodmate.wellness.dto.UserHabitCountDto;
import com.moodmate.wellness.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Habit> findByIdAndUserId(Long id, Long userId);

    // Phase 1E, Step 4 (Scheduling Rules) - total habits defined per user, half of the pair
    // HabitService.todaySummaryForAllUsers() merges with HabitCompletionRepository's per-user
    // completions-today count below.
    @Query("SELECT new com.moodmate.wellness.dto.UserHabitCountDto(h.userId, COUNT(h)) FROM Habit h GROUP BY h.userId")
    List<UserHabitCountDto> countHabitsPerUser();
}
