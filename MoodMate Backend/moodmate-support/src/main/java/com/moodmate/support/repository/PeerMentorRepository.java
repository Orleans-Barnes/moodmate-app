package com.moodmate.support.repository;

import com.moodmate.support.entity.PeerMentor;
import com.moodmate.support.entity.PeerMentorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeerMentorRepository extends JpaRepository<PeerMentor, Long> {
    // Fix #4 - the public roster now also filters on APPROVED, mirroring
    // CounsellorRepository.findByStatusAndAvailableTrueOrderBySortOrder. Replaces the old
    // findByAvailableTrueOrderBySortOrder (removed - this was its only caller).
    List<PeerMentor> findByStatusAndAvailableTrueOrderBySortOrder(PeerMentorStatus status);

    // Phase 1G - resolves a logged-in MENTOR-role user to their roster row, same pattern as
    // CounsellorRepository.findByUserId.
    Optional<PeerMentor> findByUserId(Long userId);

    // Phase 1H (Admin Portal - Peer Mentor Management) - "all mentors, including deactivated
    // (available=false) ones" admin listing, mirrors CounsellorRepository.findAllByOrderByNameAsc.
    List<PeerMentor> findAllByOrderByNameAsc();

    // Fix #4 - admin's pending mentor applications queue, mirrors
    // CounsellorRepository.findByStatus.
    List<PeerMentor> findByStatus(PeerMentorStatus status);
}
