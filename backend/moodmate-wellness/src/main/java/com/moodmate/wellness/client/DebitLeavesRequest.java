package com.moodmate.wellness.client;

/** Local copy of wallet-service's request body shape for POST /internal/wallet/debit. */
public record DebitLeavesRequest(Long userId, int amount, LeafTransactionReason reason) {
}
