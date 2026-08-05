package com.moodmate.wallet.dto;

import com.moodmate.wallet.entity.LeafTransactionReason;

import java.time.Instant;

public record LeafTransactionDto(Long id, int amount, LeafTransactionReason reason, Instant createdAt) {
}
