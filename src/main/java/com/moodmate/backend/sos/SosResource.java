package com.moodmate.backend.sos;

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
 * Crisis / SOS resources. Per product rule these are always free and public -
 * see SecurityConfig.PUBLIC_ENDPOINTS ("/api/sos/**") - never gate this behind auth or Pro.
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

    @Column(length = 500)
    private String description;

    private String phone;

    private String url;

    @Column(nullable = false)
    private String country;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
