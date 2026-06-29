package com.moodmate.backend.sos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SosResourceRepository extends JpaRepository<SosResource, Long> {

    List<SosResource> findAllByOrderBySortOrderAsc();

    List<SosResource> findByCountryOrderBySortOrderAsc(String country);
}
