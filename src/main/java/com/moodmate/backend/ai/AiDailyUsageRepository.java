package com.moodmate.backend.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

public interface AiDailyUsageRepository extends JpaRepository<AiDailyUsage, Long> {

    Optional<AiDailyUsage> findByUserIdAndUsageDate(Long userId, LocalDate date);

    /** Nightly cleanup — removes rows older than 30 days (called by CleanupJob). */
    @Modifying
    @Query("DELETE FROM AiDailyUsage u WHERE u.usageDate < :cutoff")
    int deleteOlderThan(LocalDate cutoff);
}
