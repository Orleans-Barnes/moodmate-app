package com.moodmate.support.repository;

import com.moodmate.support.entity.CounsellorRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CounsellorRatingRepository extends JpaRepository<CounsellorRating, Long> {
    boolean existsByAppointmentId(Long appointmentId);

    long countByCounsellorId(Long counsellorId);

    // Fix #5 - Double (not double) so a counsellor with zero ratings maps cleanly to null rather
    // than a misleading 0.0 average; toDto/CounsellorDto surfaces that as "no ratings yet", not a
    // 0-star rating.
    @Query("select avg(r.stars) from CounsellorRating r where r.counsellorId = :counsellorId")
    Double averageStarsByCounsellorId(@Param("counsellorId") Long counsellorId);
}
