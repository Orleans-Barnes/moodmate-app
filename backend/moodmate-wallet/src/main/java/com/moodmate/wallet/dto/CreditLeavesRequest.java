package com.moodmate.wallet.dto;

import com.moodmate.wallet.entity.LeafTransactionReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Internal, service-to-service request body - used by wellness-service (goal-completion reward),
 * mood-service (check-in reward), journal-service (gratitude reward) etc. to credit leaves without
 * touching wallet's tables directly. See WalletController's /internal/credit endpoint. */
public record CreditLeavesRequest(@NotNull Long userId, @Positive int amount, @NotNull LeafTransactionReason reason) {
}
