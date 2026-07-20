package com.moodmate.wallet.dto;

/** Cross-service read - see WalletService.getInternalSummary() and InternalWalletController. */
public record InternalWalletSummary(int leafBalance, String equippedSkinEmoji) {
}
