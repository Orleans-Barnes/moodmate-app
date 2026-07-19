package com.moodmate.auth.repository;

import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Backs POST /api/auth/admin-setup - "first person to hit this endpoint becomes admin",
    // enforced here so the endpoint is self-disabling the moment one ADMIN row exists.
    boolean existsByRole(com.moodmate.auth.entity.Role role);

    /** New for Feature 9 (Notification Deep Linking) - backs NotificationService.notifyRoles(),
     * used to broadcast a crisis alert to every ADMIN/COUNSELLOR account. */
    List<User> findByRoleIn(List<Role> roles);

    // Phase 1H (Admin Portal - User Management) - backs GET /api/users/admin's search box
    // (name or email, case-insensitive substring match, same "OR across two fields" shape as
    // SupportScreen's client-side roster search, just server-side/paginated here since the full
    // user table isn't something the frontend should ever load in one shot).
    Page<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName, String email, Pageable pageable);
}
