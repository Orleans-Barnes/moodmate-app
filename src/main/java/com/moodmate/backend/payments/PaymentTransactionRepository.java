package com.moodmate.backend.payments;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByReference(String reference);

    Page<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
