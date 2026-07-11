package com.moodmate.backend.habits;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity @Table(name = "habits")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Habit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id",  nullable = false) private Long userId;
    @Column(nullable = false, length = 120)      private String name;
    @Column(nullable = false, length = 10)       private String icon;
    @Column(nullable = false, length = 10)       private String color;
    @CreationTimestamp private Instant createdAt;
    @Column(nullable = false) private boolean archived;
}
