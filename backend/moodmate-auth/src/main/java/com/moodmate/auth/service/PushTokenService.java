package com.moodmate.auth.service;

import com.moodmate.auth.entity.PushToken;
import com.moodmate.auth.repository.PushTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registers/removes Expo push tokens (src/api/push.ts). No notification-sending logic here on
 * purpose - the frontend only calls register/remove, nothing in this codebase (monolith or
 * microservices) ever sends a push notification yet, so this is scoped to exactly what's called,
 * not speculative send infrastructure. Adding actual sends (e.g. from moodmate-crisis on a new
 * alert) is a separate, explicitly-scoped feature, not implied by wiring up storage for the token.
 */
@Service
@RequiredArgsConstructor
public class PushTokenService {

    private final PushTokenRepository repo;

    @Transactional
    public void register(Long userId, String token) {
        PushToken existing = repo.findByToken(token).orElse(null);
        if (existing != null) {
            // Same physical device re-registering, possibly under a different account (e.g. a
            // different user logged in on the same phone) - re-point it rather than duplicate.
            existing.setUserId(userId);
            repo.save(existing);
        } else {
            repo.save(PushToken.builder().userId(userId).token(token).build());
        }
    }

    @Transactional
    public void remove(Long userId, String token) {
        // Scoped to (userId, token) - a user can only remove a token currently associated with
        // their own account, not an arbitrary token string belonging to someone else's device.
        repo.deleteByUserIdAndToken(userId, token);
    }
}
