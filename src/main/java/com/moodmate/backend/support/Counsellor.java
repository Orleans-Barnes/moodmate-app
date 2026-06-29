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
@Table(name = "counsellors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Counsellor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_emoji", nullable = false)
    private String avatarEmoji;

    /** Comma-separated tags, e.g. "anxiety,academic stress" - split into a list in the DTO layer. */
    @Column(length = 500)
    private String specialties;

    @Column(name = "is_available", nullable = false)
    private boolean available;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
