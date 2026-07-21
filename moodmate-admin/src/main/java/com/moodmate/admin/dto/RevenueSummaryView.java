package com.moodmate.admin.dto;

/**
 * Item 8 (Admin Revenue Dashboard) - local mirror of moodmate-wallet's RevenueSummaryResponse,
 * same "duplicate the DTO shape locally rather than share a jar across service boundaries"
 * convention every cross-service read in this project follows.
 */
public record RevenueSummaryView(
        long subscriptionRevenuePesewas,
        long leafPackRevenuePesewas,
        long totalRevenuePesewas,
        long successfulTransactionCount,
        long activeProCount,
        long trialingCount
) {
}
