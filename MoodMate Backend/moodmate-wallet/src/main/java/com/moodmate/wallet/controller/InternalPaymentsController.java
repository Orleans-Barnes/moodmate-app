package com.moodmate.wallet.controller;

import com.moodmate.wallet.dto.AdminOverrideSubscriptionRequest;
import com.moodmate.wallet.dto.RevenueSummaryResponse;
import com.moodmate.wallet.dto.SubscriptionStateResponse;
import com.moodmate.wallet.service.PaymentsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Service-to-service only - same "deliberately NOT under /api/**, unreachable through the
 * gateway" reasoning as InternalWalletController's doc comment. Added for Premium Enforcement:
 * moodmate-ai and moodmate-journal call this to check whether a user is Pro before applying their
 * free-tier usage caps, instead of trusting a client-supplied flag (which is exactly the "never
 * rely only on frontend validation" gap the audit flagged).
 */
@RestController
@RequestMapping("/internal/payments")
@RequiredArgsConstructor
public class InternalPaymentsController {

    private final PaymentsService paymentsService;

    @GetMapping("/subscription/{userId}")
    public SubscriptionStateResponse subscription(@PathVariable Long userId) {
        return paymentsService.getSubscriptionState(userId);
    }

    // Item 8 (Admin Revenue Dashboard) - moodmate-admin's RevenueServiceClient calls this.
    @GetMapping("/revenue-summary")
    public RevenueSummaryResponse revenueSummary() {
        return paymentsService.getRevenueSummary();
    }

    // Premium & Monetization (Milestone 3) - admin override, called by moodmate-admin's
    // RevenueServiceClient. Same "service-to-service only" reasoning as the rest of this class.
    @PostMapping("/subscription/{userId}/override")
    public SubscriptionStateResponse overrideSubscription(@PathVariable Long userId,
                                                            @Valid @RequestBody AdminOverrideSubscriptionRequest request) {
        return paymentsService.adminOverrideSubscription(userId, request);
    }
}
