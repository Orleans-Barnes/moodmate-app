package com.moodmate.support.repository;

import com.moodmate.support.entity.Appointment;
import com.moodmate.support.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserIdOrderByScheduledAtDesc(Long userId);

    Optional<Appointment> findByIdAndUserId(Long id, Long userId);

    List<Appointment> findByCounsellorIdOrderByScheduledAtDesc(Long counsellorId);

    Optional<Appointment> findByIdAndCounsellorId(Long id, Long counsellorId);

    // Phase 1E, Step 4 (Scheduling Rules) - feeds GET /internal/support/appointments/confirmed.
    // Returns every CONFIRMED appointment regardless of date; moodmate-notifications' scheduled
    // job applies the actual "within 24h" window check via AppointmentReminderRule.
    List<Appointment> findByStatus(AppointmentStatus status);
}
