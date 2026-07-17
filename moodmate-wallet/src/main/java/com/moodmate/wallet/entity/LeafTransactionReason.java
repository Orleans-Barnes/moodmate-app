package com.moodmate.wallet.entity;

public enum LeafTransactionReason {
    GOAL_REWARD,
    CHECKIN_REWARD,
    GRATITUDE_REWARD,
    SKIN_PURCHASE,
    LEAF_PACK_PURCHASE,
    GAME_REWARD,
    // New: wellness-service's POST /api/wellness/streak/shield debits leaves via
    // InternalWalletController's new /internal/wallet/debit endpoint with this reason.
    STREAK_SHIELD_PURCHASE,
    // Feature 14 (Shop Improvements) - wellness-service's POST /api/wellness/boosts/double-xp
    // debits leaves the same way STREAK_SHIELD_PURCHASE does.
    DOUBLE_XP_BOOST_PURCHASE
}
