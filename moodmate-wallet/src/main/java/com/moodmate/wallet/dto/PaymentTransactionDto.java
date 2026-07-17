package com.moodmate.wallet.dto;

import com.moodmate.wallet.entity.PaymentPurpose;
import com.moodmate.wallet.entity.PaymentStatus;

import java.time.Instant;

public record PaymentTransactionDto(String reference, PaymentPurpose purpose, String itemCode, int amountPesewas,
                                     String currency, PaymentStatus status, Instant paidAt, Instant createdAt) {
}
