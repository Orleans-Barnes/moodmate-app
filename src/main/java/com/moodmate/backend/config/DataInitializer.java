package com.moodmate.backend.config;

import com.moodmate.backend.auth.Role;
import com.moodmate.backend.auth.User;
import com.moodmate.backend.auth.UserRepository;
import com.moodmate.backend.support.Counsellor;
import com.moodmate.backend.support.CounsellorRepository;
import com.moodmate.backend.support.CounsellorStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds default accounts on first startup.
 * Uses existsByEmail so no extra repository methods are needed.
 * Safe to leave in prod — each block is guarded by an existence check.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    // ── Admin defaults ────────────────────────────────────────────────────────
    private static final String ADMIN_EMAIL    = "admin@moodmate.app";
    private static final String ADMIN_PASSWORD = "Admin@1234";
    private static final String ADMIN_NAME     = "MoodMate Admin";

    // ── Default counsellor defaults ───────────────────────────────────────────
    private static final String COUNSELLOR_EMAIL    = "counsellor@moodmate.app";
    private static final String COUNSELLOR_PASSWORD = "Counsellor@1234";
    private static final String COUNSELLOR_NAME     = "Dr. Ama Mensah";

    private final UserRepository       userRepository;
    private final CounsellorRepository counsellorRepository;
    private final PasswordEncoder      passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedCounsellor();
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    private void seedAdmin() {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            log.info("[DataInitializer] Admin account already exists — skipping.");
            return;
        }

        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                .fullName(ADMIN_NAME)
                .guest(false)
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);

        log.info("╔══════════════════════════════════════════════════╗");
        log.info("║  DEFAULT ADMIN ACCOUNT CREATED                   ║");
        log.info("║  Email   : {}              ║", ADMIN_EMAIL);
        log.info("║  Password: {}                       ║", ADMIN_PASSWORD);
        log.info("╚══════════════════════════════════════════════════╝");
    }

    // ── Counsellor ────────────────────────────────────────────────────────────

    private void seedCounsellor() {
        if (userRepository.existsByEmail(COUNSELLOR_EMAIL)) {
            log.info("[DataInitializer] Default counsellor account already exists — skipping.");
            return;
        }

        // 1. Create the user account with COUNSELLOR role
        User user = User.builder()
                .email(COUNSELLOR_EMAIL)
                .passwordHash(passwordEncoder.encode(COUNSELLOR_PASSWORD))
                .fullName(COUNSELLOR_NAME)
                .guest(false)
                .role(Role.COUNSELLOR)
                .build();

        User saved = userRepository.save(user);

        // 2. Create the counsellor roster entry (APPROVED so they appear in listings)
        Counsellor roster = Counsellor.builder()
                .userId(saved.getId())
                .name(COUNSELLOR_NAME)
                .title("Licensed Counsellor")
                .bio("Specialises in anxiety, academic stress, and life transitions.")
                .avatarEmoji("👩‍⚕️")
                .specialties("anxiety,academic stress,life transitions")
                .available(true)
                .sortOrder(0)
                .status(CounsellorStatus.APPROVED)
                .build();

        counsellorRepository.save(roster);

        log.info("╔══════════════════════════════════════════════════╗");
        log.info("║  DEFAULT COUNSELLOR ACCOUNT CREATED              ║");
        log.info("║  Email   : {}   ║", COUNSELLOR_EMAIL);
        log.info("║  Password: {}              ║", COUNSELLOR_PASSWORD);
        log.info("╚══════════════════════════════════════════════════╝");
    }
}
