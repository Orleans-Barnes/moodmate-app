package com.moodmate.backend.wallet.dto;

import com.moodmate.backend.wallet.LeafTransactionReason;

import java.time.Instant;

public record LeafTransactionDto(Long id, int amount, LeafTransactionReason reason, Instant createdAt) {
}
