package com.moodmate.backend.support;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserIdOrderByScheduledAtDesc(Long userId);

    Optional<Appointment> findByIdAndUserId(Long id, Long userId);

    List<Appointment> findByCounsellorIdOrderByScheduledAtDesc(Long counsellorId);

    Optional<Appointment> findByIdAndCounsellorId(Long id, Long counsellorId);
}
