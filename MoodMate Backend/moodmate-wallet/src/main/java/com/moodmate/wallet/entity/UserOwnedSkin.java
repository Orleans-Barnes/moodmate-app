package com.moodmate.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_owned_skins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOwnedSkin {

    @EmbeddedId
    private UserOwnedSkinId id;

    @Column(name = "acquired_at", nullable = false)
    private Instant acquiredAt;

    @PrePersist
    void onCreate() {
        if (acquiredAt == null) {
            acquiredAt = Instant.now();
        }
    }
}
