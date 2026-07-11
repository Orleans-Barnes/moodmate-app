package com.moodmate.backend.journal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    Page<JournalEntry> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);
}
