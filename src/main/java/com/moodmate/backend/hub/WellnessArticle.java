package com.moodmate.backend.hub;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
