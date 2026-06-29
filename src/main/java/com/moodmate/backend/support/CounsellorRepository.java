package com.moodmate.backend.support;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CounsellorRepository extends JpaRepository<Counsellor, Long> {
    List<Counsellor> findByAvailableTrueOrderBySortOrder();
}
