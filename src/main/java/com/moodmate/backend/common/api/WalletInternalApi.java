package com.moodmate.backend.common.api;

/**
 * Contract for cross-domain wallet operations.
 *
 * Implemented by {@code wallet.WalletService}.
 * Injected by {@code payments.PaymentsService} so it can credit leaves after a successful
 * Paystack payment without importing wallet or wellness repositories directly.
 */
public interface WalletInternalApi {

    /**
     * Credits {@code amount} leaves to the user's wallet and records a leaf transaction.
     *
     * @param userId the recipient's user ID
     * @param amount number of leaves to credit (must be positive)
     * @param reason a valid {@link com.moodmate.backend.wallet.LeafTransactionReason} name,
     *               e.g. {@code "LEAF_PACK_PURCHASE"}
     */
    void creditLeaves(Long userId, int amount, String reason);
}
