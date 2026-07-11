package com.moodmate.backend.crisis;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CrisisAlertRepository extends JpaRepository<CrisisAlert, Long> {

    /** All open alerts, newest first — shown to counsellors and admin. */
    List<CrisisAlert> findByStatusOrderByCreatedAtDesc(CrisisStatus status);

    /** All alerts for a specific student, newest first. */
    List<CrisisAlert> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** All alerts regardless of status, newest first — for admin view. */
    List<CrisisAlert> findAllByOrderByCreatedAtDesc();

    /** Count of currently open alerts — for dashboard badges. */
    long countByStatus(CrisisStatus status);

    /** Has this student already triggered an OPEN alert in the last hour? Prevents spam. */
    @Query("""
            SELECT COUNT(a) > 0
            FROM CrisisAlert a
            WHERE a.userId = :userId
              AND a.status = 'OPEN'
              AND a.createdAt > (CURRENT_TIMESTAMP - 1 HOUR)
            """)
    boolean hasRecentOpenAlert(Long userId);
}
