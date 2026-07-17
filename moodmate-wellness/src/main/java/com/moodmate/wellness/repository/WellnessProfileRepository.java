package com.moodmate.wellness.repository;

import com.moodmate.wellness.entity.WellnessProfile;
import org.springframework.data.jpa.repository.JpaRepository;

/** userId IS the primary key (see WellnessProfile), so JpaRepository's own findById(Long) already
 * does what the monolith's equivalent needed - no extra query methods required. */
public interface WellnessProfileRepository extends JpaRepository<WellnessProfile, Long> {
}
