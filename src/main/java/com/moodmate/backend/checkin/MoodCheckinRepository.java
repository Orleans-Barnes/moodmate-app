package com.moodmate.backend.checkin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MoodCheckinRepository extends JpaRepository<MoodCheckin, Long> {
    Page<MoodCheckin> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
