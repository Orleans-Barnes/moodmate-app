package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.LeafTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeafTransactionRepository extends JpaRepository<LeafTransaction, Long> {
    Page<LeafTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
