package com.moodmate.support.repository;

import com.moodmate.support.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByUserIdAndCounsellorId(Long userId, Long counsellorId);

    Optional<Conversation> findByUserIdAndPeerMentorId(Long userId, Long peerMentorId);

    List<Conversation> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Conversation> findByIdAndUserId(Long id, Long userId);

    List<Conversation> findByCounsellorIdOrderByCreatedAtDesc(Long counsellorId);

    Optional<Conversation> findByIdAndCounsellorId(Long id, Long counsellorId);
}
