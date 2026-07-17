package com.moodmate.mood.repository;

import com.moodmate.mood.entity.MoodCheckin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface MoodCheckinRepository extends JpaRepository<MoodCheckin, Long> {
    // Matches the monolith's contract - paginated, used by GET /api/checkins.
    Page<MoodCheckin> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Kept from the pre-existing service stub (not in the monolith) for the mood-trend/analytics
    // endpoints - additive, doesn't conflict with the monolith's contract above.
    List<MoodCheckin> findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(Long userId, Instant after);

    long countByUserId(Long userId);
}
