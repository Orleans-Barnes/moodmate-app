package com.moodmate.auth.repository;

import com.moodmate.auth.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** New for Feature 10 (Emergency Contacts). */
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {

    List<EmergencyContact> findByUserIdOrderByPrimaryDescCreatedAtAsc(Long userId);

    Optional<EmergencyContact> findByIdAndUserId(Long id, Long userId);

    Optional<EmergencyContact> findByUserIdAndPrimaryTrue(Long userId);

    long countByUserId(Long userId);
}
