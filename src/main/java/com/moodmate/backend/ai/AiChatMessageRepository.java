package com.moodmate.backend.ai;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {

    /** Most recent messages for a user — used to build conversation context. */
    List<AiChatMessage> findByUserIdOrderByCreatedAtAsc(Long userId, Pageable pageable);

    /** Paginated history for GET /api/ai/chat/history. */
    Page<AiChatMessage> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Clear a user's entire chat history. */
    @Modifying
    @Query("DELETE FROM AiChatMessage m WHERE m.userId = :userId")
    int deleteAllByUserId(Long userId);

    /** Nightly cleanup — prune messages older than the given cutoff. */
    @Modifying
    @Query("DELETE FROM AiChatMessage m WHERE m.createdAt < :cutoff")
    int deleteOlderThan(Instant cutoff);
}
