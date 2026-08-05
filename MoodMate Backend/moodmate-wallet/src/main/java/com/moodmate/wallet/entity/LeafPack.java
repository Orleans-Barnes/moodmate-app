package com.moodmate.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "leaf_packs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeafPack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private int leaves;

    @Column(name = "price_pesewas", nullable = false)
    private int pricePesewas;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
