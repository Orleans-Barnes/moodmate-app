package com.moodmate.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Wellness Library - Books. A real, purchasable book catalogue entry (title/author/description +
 * a real GHS price), mirrors LeafPack's shape exactly. No cover-image URL field on purpose - book
 * covers are rendered client-side as a gradient + icon + title (see ResourcesScreen.tsx), the same
 * "code-composed, not hotlinked" decision already used for tree skins and role-select art, so a
 * dead image link can never reproduce the "resources with no info" bug this feature was built to
 * fix in the first place.
 */
@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "price_pesewas", nullable = false)
    private int pricePesewas;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
