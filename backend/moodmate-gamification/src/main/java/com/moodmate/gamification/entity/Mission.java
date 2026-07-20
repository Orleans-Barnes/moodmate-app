package com.moodmate.gamification.entity;

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

@Entity
@Table(name = "missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "mission_type", nullable = false, length = 20)
    @Builder.Default
    private String missionType = "DAILY"; // DAILY | WEEKLY

    @Column(name = "target_count", nullable = false)
    @Builder.Default
    private int targetCount = 1;

    @Column(name = "xp_reward", nullable = false)
    @Builder.Default
    private int xpReward = 25;

    @Column(name = "leaf_reward", nullable = false)
    @Builder.Default
    private int leafReward = 5;

    @Column(name = "expires_on")
    private LocalDate expiresOn; // null = never expires
}
