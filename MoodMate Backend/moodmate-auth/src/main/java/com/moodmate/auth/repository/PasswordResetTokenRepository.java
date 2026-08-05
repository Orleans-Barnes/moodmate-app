package com.moodmate.auth.repository;

import com.moodmate.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    List<PasswordResetToken> findAllByUserIdAndUsedFalseOrderByCreatedAtDesc(Long userId);
}
