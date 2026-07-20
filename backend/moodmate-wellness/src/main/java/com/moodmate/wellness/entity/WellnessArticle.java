package com.moodmate.wellness.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wellness_articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WellnessArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String summary;

    @Column(nullable = false)
    private String body;

    @Column(nullable = false)
    private String category;

    @Column(name = "read_minutes", nullable = false)
    private int readMinutes;

    @Column(name = "image_emoji", nullable = false)
    private String imageEmoji;

    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;
}
