package com.moodmate.support.entity;

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

/**
 * Crisis / SOS resources. Per product rule these are always free and public - never gate this
 * behind auth or Pro. Field defaults need @Builder.Default or Lombok's builder() silently drops
 * them (same class of bug fixed in moodmate-auth's User.java) - not currently exercised by any
 * code path (rows only ever come from the Flyway seed data, never Java's builder), but fixing it
 * now removes the compiler warning and closes the gap before anything does build one.
 */
@Entity
@Table(name = "sos_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SosResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    private String phone;

    private String url;

    @Column(nullable = false)
    @Builder.Default
    private String country = "GH";

    @Column(name = "sort_order")
    @Builder.Default
    private int sortOrder = 0;
}
