package com.moodmate.backend.wallet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserOwnedSkinRepository extends JpaRepository<UserOwnedSkin, UserOwnedSkinId> {
    List<UserOwnedSkin> findByIdUserId(Long userId);
}
