package com.moodmate.backend.payments.dto;

import com.moodmate.backend.payments.PaymentPurpose;
import com.moodmate.backend.payments.PaymentStatus;

import java.time.Instant;

public record PaymentTransactionDto(String reference, PaymentPurpose purpose, String itemCode, int amountPesewas,
                                     String currency, PaymentStatus status, Instant paidAt, Instant createdAt) {
}
