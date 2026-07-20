package com.moodmate.wallet.dto;

import com.moodmate.wallet.entity.LeafTransactionReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Internal, service-to-service request body - mirrors CreditLeavesRequest but subtracts instead
 * of adding. Amount is always positive here too (the service subtracts it); rejected with 402 if
 * it exceeds the current balance, same pattern as WalletService.equipSkin's cost check. See
 * InternalWalletController's /internal/wallet/debit endpoint. */
public record DebitLeavesRequest(@NotNull Long userId, @Positive int amount, @NotNull LeafTransactionReason reason) {
}
