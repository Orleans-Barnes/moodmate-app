package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.SleepGoal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SleepGoalRepository extends JpaRepository<SleepGoal, Long> {
}
