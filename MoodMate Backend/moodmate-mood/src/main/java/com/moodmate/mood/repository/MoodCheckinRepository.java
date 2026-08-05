package com.moodmate.mood.repository;

import com.moodmate.mood.dto.UserLastCheckInSummary;
import com.moodmate.mood.entity.MoodCheckin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface MoodCheckinRepository extends JpaRepository<MoodCheckin, Long> {
    // Matches the monolith's contract - paginated, used by GET /api/checkins.
    Page<MoodCheckin> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Kept from the pre-existing service stub (not in the monolith) for the mood-trend/analytics
    // endpoints - additive, doesn't conflict with the monolith's contract above.
    List<MoodCheckin> findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(Long userId, Instant after);

    long countByUserId(Long userId);

    // Phase 1E, Step 4 (Scheduling Rules) - feeds GET /internal/mood/latest-per-user, which
    // moodmate-notifications' MoodReminderScheduledJob polls to decide who needs a "you haven't
    // checked in today" reminder. One row per distinct user_id this service has ever seen - a
    // constructor expression, not a projection interface, keeps the aggregate MAX(createdAt) typed
    // as a real Instant rather than Object[].
    @Query("SELECT new com.moodmate.mood.dto.UserLastCheckInSummary(m.userId, MAX(m.createdAt)) " +
            "FROM MoodCheckin m GROUP BY m.userId")
    List<UserLastCheckInSummary> findLatestCheckInPerUser();
}
