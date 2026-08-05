package com.moodmate.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** Tracks which books a user has purchased - mirrors UserOwnedSkin exactly. Presence of a row is
 *  the ownership check; re-buying an already-owned book is prevented in PaymentsService before a
 *  checkout is even started. */
@Entity
@Table(name = "user_owned_books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOwnedBook {

    @EmbeddedId
    private UserOwnedBookId id;

    @Column(name = "acquired_at", nullable = false)
    private Instant acquiredAt;

    @PrePersist
    void onCreate() {
        if (acquiredAt == null) {
            acquiredAt = Instant.now();
        }
    }
}
