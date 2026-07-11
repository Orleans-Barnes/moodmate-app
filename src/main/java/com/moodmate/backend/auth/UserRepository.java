package com.moodmate.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRole(Role role);
    long countByRoleAndGuestFalse(Role role);

    /**
     * Deletes guest accounts (and their cascade-linked wellness profiles, completions etc.)
     * created before the given cutoff. Called nightly by CleanupJob.
     * Relies on ON DELETE CASCADE being set on child tables in Flyway migrations.
     */
    @Modifying
    @Query("DELETE FROM User u WHERE u.guest = true AND u.createdAt < :cutoff")
    int deleteStaleGuestAccounts(Instant cutoff);
}
