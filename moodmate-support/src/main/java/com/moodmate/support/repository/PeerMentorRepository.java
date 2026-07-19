package com.moodmate.support.repository;

import com.moodmate.support.entity.PeerMentor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeerMentorRepository extends JpaRepository<PeerMentor, Long> {
    List<PeerMentor> findByAvailableTrueOrderBySortOrder();

    // Phase 1G - resolves a logged-in MENTOR-role user to their roster row, same pattern as
    // CounsellorRepository.findByUserId.
    Optional<PeerMentor> findByUserId(Long userId);
}
