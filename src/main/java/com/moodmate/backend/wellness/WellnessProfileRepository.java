package com.moodmate.backend.wellness;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WellnessProfileRepository extends JpaRepository<WellnessProfile, Long> {

    /** Used by StreakReminderJob to find users whose streak is at risk. */
    List<WellnessProfile> findByStreakCountGreaterThan(int streakCount);
}
