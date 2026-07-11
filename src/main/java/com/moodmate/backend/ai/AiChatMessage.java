package com.moodmate.backend.ai;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** One message in a user's AI chat history. Role is either "user" or "assistant". */
@Entity
@Table(name = "ai_chat_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** "user" or "assistant" */
    @Column(name = "role", nullable = false, length = 20)
    private String role;

    /** The message text (user input or AI reply). For audio, the transcribed text. */
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /** "text", "audio", or "image" */
    @Column(name = "message_type", nullable = false, length = 20)
    @Builder.Default
    private String messageType = "text";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
