package com.moodmate.admin.repository;

import com.moodmate.admin.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    List<Institution> findAllByOrderByNameAsc();

    List<Institution> findAllByActiveTrueOrderByNameAsc();

    boolean existsByShortNameIgnoreCase(String shortName);
}
