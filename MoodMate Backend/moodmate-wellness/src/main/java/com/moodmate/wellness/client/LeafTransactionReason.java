package com.moodmate.wellness.client;

/** Local copy of wallet-service's enum - must stay in sync with
 * com.moodmate.wallet.entity.LeafTransactionReason since it's serialized by name over HTTP. */
public enum LeafTransactionReason {
    GOAL_REWARD,
    CHECKIN_REWARD,
    GRATITUDE_REWARD,
    SKIN_PURCHASE,
    LEAF_PACK_PURCHASE,
    GAME_REWARD,
    STREAK_SHIELD_PURCHASE,
    DOUBLE_XP_BOOST_PURCHASE
}
