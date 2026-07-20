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

@Entity
@Table(name = "achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String key;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "icon_name")
    private String iconName;

    // @Builder.Default matters here - without it Lombok's builder() goes through the all-args
    // constructor and silently drops these defaults, so Achievement.builder().build() would
    // persist xpReward=0/leafReward=0 instead of the intended defaults. Same class of bug fixed
    // in moodmate-auth's User.java and moodmate-support's SosResource.java.
    @Column(name = "xp_reward", nullable = false)
    @Builder.Default
    private int xpReward = 50;

    @Column(name = "leaf_reward", nullable = false)
    @Builder.Default
    private int leafReward = 0;
}
