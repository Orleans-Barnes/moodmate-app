package com.moodmate.ai.repository;

import com.moodmate.ai.entity.AiChatMessage;
import com.moodmate.ai.entity.ChatRole;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {
    // Newest-first, capped by the caller's Pageable - used both by GET /api/ai/chat/history (with
    // the frontend's requested `size`) and by AiChatService to pull recent context for Groq (with
    // moodmate.groq.max-history-messages, then reversed back to oldest-first before sending).
    List<AiChatMessage> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    void deleteByUserId(Long userId);

    /** Counts only USER-authored messages (not the assistant's replies) since a given instant -
     * used by Premium Enforcement's free-tier daily message cap and, new for Feature 11, exposed
     * proactively via GET /api/ai/usage. */
    long countByUserIdAndRoleAndCreatedAtGreaterThanEqual(Long userId, ChatRole role, Instant since);

    /** New for Feature 11 (AI Safety Improvements) - backs the duplicate-spam Abuse Protection
     * guard in AiChatService.sendMessage(): the user's own most recent message, used to check
     * whether the incoming one is an exact repeat sent within a short window. */
    Optional<AiChatMessage> findTopByUserIdAndRoleOrderByCreatedAtDesc(Long userId, ChatRole role);
}
