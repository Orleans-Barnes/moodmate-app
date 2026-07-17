package com.moodmate.auth.repository;

import com.moodmate.auth.entity.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PushTokenRepository extends JpaRepository<PushToken, Long> {
    Optional<PushToken> findByToken(String token);
    void deleteByUserIdAndToken(Long userId, String token);

    /** New for Feature 9 (Notification Deep Linking) - a user may have more than one device
     * registered (e.g. re-installed the app), so sending a notification fans out to every token
     * on file for them, not just the most recent. */
    List<PushToken> findByUserId(Long userId);
}
