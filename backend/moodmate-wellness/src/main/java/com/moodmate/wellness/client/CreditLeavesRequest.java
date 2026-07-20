package com.moodmate.wellness.client;

/** Local copy of wallet-service's request body shape for POST /internal/wallet/credit. */
public record CreditLeavesRequest(Long userId, int amount, LeafTransactionReason reason) {
}
