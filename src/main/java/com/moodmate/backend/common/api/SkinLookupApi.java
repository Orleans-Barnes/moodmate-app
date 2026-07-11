package com.moodmate.backend.common.api;

/**
 * Contract for cross-domain tree skin lookups.
 *
 * Implemented by {@code wallet.WalletService}.
 * Injected by {@code wellness.WellnessService} and {@code wellness.WellnessProfileInitializer}
 * so those classes can resolve skin data without importing from the wallet package directly.
 * This breaks the wellness → wallet circular dependency.
 */
public interface SkinLookupApi {

    /**
     * Returns the emoji for the given skin ID.
     * Falls back to "🌳" if the skin record doesn't exist.
     */
    String getEmoji(Long skinId);

    /**
     * Returns the database ID for the given skin code (e.g. {@code "CLASSIC"}).
     *
     * @throws IllegalStateException if no skin with the given code exists —
     *                               this indicates a missing seed migration row, not a user error
     */
    Long getSkinIdByCode(String skinCode);
}
