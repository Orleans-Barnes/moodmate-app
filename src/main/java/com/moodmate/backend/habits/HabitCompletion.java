package com.moodmate.backend.habits;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "habit_completions", uniqueConstraints = @UniqueConstraint(columnNames = {"habit_id","completed_on"}))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class HabitCompletion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "habit_id",  nullable = false) private Long habitId;
    @Column(name = "user_id",   nullable = false) private Long userId;
    @Column(name = "completed_on", nullable = false) private LocalDate completedOn;
}
