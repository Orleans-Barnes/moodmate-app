package com.moodmate.backend.push;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PushTokenRepository extends JpaRepository<PushToken, Long> {

    List<PushToken> findByUserId(Long userId);

    Optional<PushToken> findByToken(String token);

    @Transactional
    void deleteByToken(String token);

    @Transactional
    void deleteByUserId(Long userId);
}
