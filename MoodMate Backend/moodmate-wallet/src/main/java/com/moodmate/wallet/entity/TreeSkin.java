package com.moodmate.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tree_skins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreeSkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String emoji;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int cost;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    // Premium gating breadth (Milestone item 7) - Pro-exclusive skins can be equipped only while
    // the user has an active Pro subscription, checked in WalletService.equipSkin. Independent of
    // `cost`/ownership: a Pro-only skin still costs leaves to unlock (or is free), but equipping it
    // additionally requires Pro right now, every time - see equipSkin's doc comment for why that's
    // "requires active Pro" rather than "requires having purchased it once."
    @Column(name = "pro_only", nullable = false)
    private boolean proOnly;
}
