package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Habit> findByIdAndUserId(Long id, Long userId);
}
