package com.moodmate.auth.config;

import com.moodmate.auth.entity.Role;
import com.moodmate.auth.entity.User;
import com.moodmate.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Seeds a demo admin account. OFF by default everywhere - only runs when
 * moodmate.seed-demo-accounts.enabled=true (SEED_DEMO_ACCOUNTS=true), which should only ever be
 * set in local/dev environments, never in a real deployment. The password is never hardcoded and
 * never logged - it must come from SEED_ADMIN_PASSWORD, and boot fails loudly if seeding is
 * enabled but no password was supplied, rather than silently falling back to a public default.
 *
 * The monolith's DataInitializer also seeded a demo counsellor account plus a Counsellor roster
 * row - the roster row is support-service's data (bio, specialties, availability), so once
 * moodmate-support is ported it should seed that half itself, behind the same enabled flag, after
 * calling this service (or being told the counsellor user's id) to create the underlying user.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "moodmate.seed-demo-accounts.enabled", havingValue = "true")
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@moodmate.app";
    private static final String ADMIN_NAME = "MoodMate Admin";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${moodmate.seed-demo-accounts.admin-password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (!StringUtils.hasText(adminPassword)) {
            throw new IllegalStateException(
                    "moodmate.seed-demo-accounts.enabled=true but SEED_ADMIN_PASSWORD was not set. "
                            + "Set it (e.g. in your local docker-compose env) before starting this service.");
        }

        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            log.info("[DataInitializer] Admin account already exists - skipping.");
            return;
        }

        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .fullName(ADMIN_NAME)
                .guest(false)
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
        log.info("[DataInitializer] Demo admin account created: {} (password from SEED_ADMIN_PASSWORD, not logged).",
                ADMIN_EMAIL);
    }
}
