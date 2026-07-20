package com.moodmate.support.repository;

import com.moodmate.support.entity.MentorRequest;
import com.moodmate.support.entity.MentorRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentorRequestRepository extends JpaRepository<MentorRequest, Long> {
    List<MentorRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<MentorRequest> findByPeerMentorIdOrderByCreatedAtDesc(Long peerMentorId);

    Optional<MentorRequest> findByIdAndPeerMentorId(Long id, Long peerMentorId);

    boolean existsByUserIdAndPeerMentorIdAndStatus(Long userId, Long peerMentorId, MentorRequestStatus status);
}
