package com.moodmate.backend.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface CounsellorWhitelistRepository extends JpaRepository<CounsellorWhitelist, Long> {

    boolean existsByEmail(String email);

    Optional<CounsellorWhitelist> findByEmail(String email);

    /** @Transactional required — Spring Data's delete-by methods do a read-then-delete internally. */
    @Transactional
    void deleteByEmail(String email);
}
