package com.moodmate.wallet.dto;

/**
 * Item 8 (Admin Revenue Dashboard) - platform-wide revenue totals, read by moodmate-admin via
 * InternalPaymentsController's /internal/payments/revenue-summary (service-to-service, not
 * gateway-routed - same reasoning as SubscriptionStateResponse's own internal endpoint). All
 * pesewas fields are SUCCESS-only sums (see PaymentTransactionRepository doc comment) - PENDING
 * and FAILED transactions are never counted as revenue.
 */
public record RevenueSummaryResponse(
        long subscriptionRevenuePesewas,
        long leafPackRevenuePesewas,
        long bookRevenuePesewas,
        long totalRevenuePesewas,
        long successfulTransactionCount,
        long activeProCount,
        long trialingCount
) {
}
