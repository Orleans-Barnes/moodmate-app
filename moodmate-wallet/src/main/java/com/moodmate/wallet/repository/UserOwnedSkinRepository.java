package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.UserOwnedSkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserOwnedSkinRepository extends JpaRepository<UserOwnedSkin, com.moodmate.wallet.entity.UserOwnedSkinId> {
    List<UserOwnedSkin> findByIdUserId(Long userId);
}
