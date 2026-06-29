package com.moodmate.backend.payments;

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
