package com.moodmate.backend.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
