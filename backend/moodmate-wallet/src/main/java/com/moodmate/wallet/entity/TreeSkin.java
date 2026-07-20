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
}
