package com.moodmate.ai.repository;

import com.moodmate.ai.entity.DisclaimerAcknowledgement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** New for Feature 11 (AI Safety Improvements). */
public interface DisclaimerAcknowledgementRepository extends JpaRepository<DisclaimerAcknowledgement, Long> {
    Optional<DisclaimerAcknowledgement> findByUserId(Long userId);
}
