package com.moodmate.backend.support;

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
@Table(name = "peer_mentors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeerMentor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_emoji", nullable = false)
    private String avatarEmoji;

    @Column(name = "focus_area")
    private String focusArea;

    @Column(name = "is_available", nullable = false)
    private boolean available;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
