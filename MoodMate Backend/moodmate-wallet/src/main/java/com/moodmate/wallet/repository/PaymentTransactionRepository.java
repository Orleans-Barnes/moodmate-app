package com.moodmate.wallet.repository;

import com.moodmate.wallet.entity.PaymentPurpose;
import com.moodmate.wallet.entity.PaymentStatus;
import com.moodmate.wallet.entity.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByReference(String reference);

    Page<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Item 8 (Admin Revenue Dashboard) - only SUCCESS transactions count as real revenue; PENDING
    // ones may never be fulfilled (abandoned checkout) and FAILED ones obviously aren't revenue.
    // coalesce(...,0) so "no successful transactions yet" reads as 0, not null.
    @Query("select coalesce(sum(t.amountPesewas), 0) from PaymentTransaction t "
            + "where t.status = :status and t.purpose = :purpose")
    long sumAmountPesewasByStatusAndPurpose(@Param("status") PaymentStatus status, @Param("purpose") PaymentPurpose purpose);

    long countByStatus(PaymentStatus status);
}
