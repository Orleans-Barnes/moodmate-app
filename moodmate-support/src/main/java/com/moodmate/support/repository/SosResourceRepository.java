package com.moodmate.support.repository;

import com.moodmate.support.entity.SosResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SosResourceRepository extends JpaRepository<SosResource, Long> {

    List<SosResource> findAllByOrderBySortOrderAsc();

    List<SosResource> findByCountryOrderBySortOrderAsc(String country);
}
