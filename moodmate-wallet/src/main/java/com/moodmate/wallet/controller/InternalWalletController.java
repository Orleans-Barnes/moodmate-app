package com.moodmate.wallet.controller;

import com.moodmate.wallet.dto.CreditLeavesRequest;
import com.moodmate.wallet.dto.DebitLeavesRequest;
import com.moodmate.wallet.dto.InternalWalletSummary;
import com.moodmate.wallet.dto.WalletStateResponse;
import com.moodmate.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Service-to-service only. Deliberately NOT under /api/wallet/** - the gateway only forwards
 * paths matching a route predicate (see moodmate-gateway application.yml), and no route matches
 * /internal/**, so this is unreachable through the gateway's public port 8080 at all. Only
 * reachable by another service calling wallet-service directly on its internal address/port
 * (8096). Putting this under /api/wallet/internal/credit instead would have been a real
 * vulnerability: the gateway's wallet-service route forwards ALL of /api/wallet/** (with a valid
 * JWT) to this service, so any logged-in user could have called it directly to grant themselves
 * free leaves.
 *
 * Called by wellness-service (goal-completion reward), mood-service (check-in reward),
 * journal-service (gratitude reward), etc. instead of those services touching wallet's tables
 * directly.
 */
@RestController
@RequestMapping("/internal/wallet")
@RequiredArgsConstructor
public class InternalWalletController {

    private final WalletService walletService;

    @PostMapping("/credit")
    public WalletStateResponse creditLeaves(@Valid @RequestBody CreditLeavesRequest request) {
        return walletService.creditLeaves(request.userId(), request.amount(), request.reason());
    }

    /** Can fail with 402 if the balance is insufficient - unlike /credit, this is not a "never fails" call. */
    @PostMapping("/debit")
    public WalletStateResponse debitLeaves(@Valid @RequestBody DebitLeavesRequest request) {
        return walletService.debitLeaves(request.userId(), request.amount(), request.reason());
    }

    /** Used by wellness-service to render leafBalance/treeSkinEmoji on WellnessStateResponse. */
    @GetMapping("/{userId}")
    public InternalWalletSummary summary(@PathVariable Long userId) {
        return walletService.getInternalSummary(userId);
    }
}
