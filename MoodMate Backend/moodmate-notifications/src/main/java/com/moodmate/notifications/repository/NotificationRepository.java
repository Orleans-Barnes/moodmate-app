package com.moodmate.notifications.repository;

import com.moodmate.notifications.entity.Notification;
import com.moodmate.notifications.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserIdAndReadAtIsNull(Long userId);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    List<Notification> findByUserIdAndReadAtIsNull(Long userId);

    // Phase 1E, Step 4 - idempotency guard for the scheduled reminder jobs (MoodReminderScheduledJob
    // and, later, its Journal/Habit/Appointment siblings): without this, a job re-run within the
    // same day (e.g. every 30 minutes, once past the rule's own time cutoff) would create a fresh
    // duplicate reminder on every single run instead of exactly one per day.
    boolean existsByUserIdAndTypeAndCreatedAtAfter(Long userId, NotificationType type, Instant createdAtAfter);
}
