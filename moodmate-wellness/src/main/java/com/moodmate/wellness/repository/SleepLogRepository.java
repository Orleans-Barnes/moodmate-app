package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.SleepLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SleepLogRepository extends JpaRepository<SleepLog, Long> {

    List<SleepLog> findByUserIdOrderByLogDateDesc(Long userId);

    Optional<SleepLog> findByUserIdAndLogDate(Long userId, LocalDate logDate);

    Optional<SleepLog> findByIdAndUserId(Long id, Long userId);

    List<SleepLog> findByUserIdAndLogDateBetweenOrderByLogDateDesc(Long userId, LocalDate from, LocalDate to);
}
