package com.moodmate.admin.repository;

import com.moodmate.admin.entity.WhitelistEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WhitelistEntryRepository extends JpaRepository<WhitelistEntry, Long> {
    List<WhitelistEntry> findAllByOrderByAddedAtDesc();

    Optional<WhitelistEntry> findByEmail(String email);

    void deleteByEmail(String email);
}
