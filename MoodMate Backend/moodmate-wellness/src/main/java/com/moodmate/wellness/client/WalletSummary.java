package com.moodmate.wellness.client;

/** Local copy of wallet-service's InternalWalletSummary shape - deserialized from its
 * GET /internal/wallet/{userId} response. */
public record WalletSummary(int leafBalance, String equippedSkinEmoji) {
}
