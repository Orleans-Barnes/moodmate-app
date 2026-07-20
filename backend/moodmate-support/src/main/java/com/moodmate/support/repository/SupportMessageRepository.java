package com.moodmate.support.repository;

import com.moodmate.support.entity.SenderType;
import com.moodmate.support.entity.SupportMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    Page<SupportMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId, Pageable pageable);

    Optional<SupportMessage> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    long countByConversationIdAndSenderTypeNotAndReadAtIsNull(Long conversationId, SenderType senderType);

    List<SupportMessage> findByConversationIdAndSenderTypeNotAndReadAtIsNull(Long conversationId, SenderType senderType);
}
