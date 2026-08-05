package com.moodmate.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Didn't exist as its own table in the monolith - leafBalance AND the equipped skin both lived on
 * wellness's WellnessProfile row. Split out here because wallet, not wellness, is the service
 * that should own money/cosmetics state; wellness-service now reaches this data via an HTTP call
 * instead of a shared table. equippedSkinId defaults to null and is resolved to the free default
 * skin (cost 0, lowest sort_order) by WalletService the first time it's read, rather than needing
 * a cross-service call just to pick a starting skin at wallet-creation time.
 */
@Entity
@Table(name = "leaf_wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeafWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "leaf_balance", nullable = false)
    @Builder.Default
    private int leafBalance = 0;

    @Column(name = "equipped_skin_id")
    private Long equippedSkinId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
