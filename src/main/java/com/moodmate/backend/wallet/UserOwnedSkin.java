package com.moodmate.backend.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
