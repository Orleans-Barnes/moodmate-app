package com.moodmate.backend.ai;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** One row per (user, day) — tracks how many AI insights calls a freemium user has made today. */
@Entity
@Table(name = "ai_daily_usage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiDailyUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    /** Counts GET /api/insights calls (freemium limit: 5/day). */
    @Column(name = "call_count", nullable = false)
    @Builder.Default
    private int callCount = 1;

    /** Counts POST /api/ai/chat calls (freemium limit: 20/day). */
    @Column(name = "chat_call_count", nullable = false)
    @Builder.Default
    private int chatCallCount = 0;

    public void increment() {
        this.callCount++;
    }

    public void incrementChat() {
        this.chatCallCount++;
    }
}
