package com.moodmate.auth.repository;

import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
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
}
