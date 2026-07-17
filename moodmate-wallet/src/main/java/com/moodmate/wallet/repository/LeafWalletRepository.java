package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.LeafWallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeafWalletRepository extends JpaRepository<LeafWallet, Long> {
    Optional<LeafWallet> findByUserId(Long userId);
}
