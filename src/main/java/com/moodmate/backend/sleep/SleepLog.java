package com.moodmate.backend.sleep;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity @Table(name = "sleep_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","log_date"}))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SleepLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id",  nullable = false) private Long userId;
    @Column(name = "log_date", nullable = false) private LocalDate logDate;
    private LocalTime bedtime;
    @Column(name = "wake_time") private LocalTime wakeTime;
    @Column(name = "duration_mins") private Integer durationMins;
    private Short quality;
    private String notes;
    @CreationTimestamp private Instant createdAt;
}
