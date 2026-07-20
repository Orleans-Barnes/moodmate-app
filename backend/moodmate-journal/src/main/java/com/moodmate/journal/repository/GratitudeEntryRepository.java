package com.moodmate.journal.repository;

import com.moodmate.journal.entity.GratitudeEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GratitudeEntryRepository extends JpaRepository<GratitudeEntry, Long> {
    Page<GratitudeEntry> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<GratitudeEntry> findByIdAndUserId(Long id, Long userId);
}
