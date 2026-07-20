package com.moodmate.wallet.controller;

import com.moodmate.wallet.dto.CheckoutResponse;
import com.moodmate.wallet.dto.LeafPackCheckoutRequest;
import com.moodmate.wallet.dto.LeafPackDto;
import com.moodmate.wallet.dto.PaymentTransactionDto;
import com.moodmate.wallet.dto.SubscriptionCheckoutRequest;
import com.moodmate.wallet.dto.SubscriptionPlanDto;
import com.moodmate.wallet.dto.SubscriptionStateResponse;
import com.moodmate.wallet.service.PaymentsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentsController {

    private final PaymentsService paymentsService;

    @GetMapping("/plans")
    public List<SubscriptionPlanDto> plans() {
        return paymentsService.listPlans();
    }

    @GetMapping("/leaf-packs")
    public List<LeafPackDto> leafPacks() {
        return paymentsService.listLeafPacks();
    }

    @GetMapping("/subscription")
    public SubscriptionStateResponse subscription(@RequestHeader("X-User-Id") Long userId) {
        return paymentsService.getSubscriptionState(userId);
    }

    @PostMapping("/subscription/trial")
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionStateResponse startTrial(@RequestHeader("X-User-Id") Long userId,
                                                 @Valid @RequestBody SubscriptionCheckoutRequest request) {
        return paymentsService.startTrial(userId, request.planCode());
    }

    @PostMapping("/subscription/checkout")
    public CheckoutResponse checkoutSubscription(@RequestHeader("X-User-Id") Long userId,
                                                  @Valid @RequestBody SubscriptionCheckoutRequest request) {
        return paymentsService.checkoutSubscription(userId, request.planCode());
    }

    @PostMapping("/leaf-packs/checkout")
    public CheckoutResponse checkoutLeafPack(@RequestHeader("X-User-Id") Long userId,
                                              @Valid @RequestBody LeafPackCheckoutRequest request) {
        return paymentsService.checkoutLeafPack(userId, request.packCode());
    }

    /** Client calls this immediately after returning from the Paystack checkout page. */
    @GetMapping("/verify/{reference}")
    public PaymentTransactionDto verify(@RequestHeader("X-User-Id") Long userId, @PathVariable String reference) {
        return paymentsService.verifyAndFulfill(userId, reference);
    }

    @GetMapping("/transactions")
    public Page<PaymentTransactionDto> transactions(@RequestHeader("X-User-Id") Long userId,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        return paymentsService.listMyTransactions(userId, PageRequest.of(page, size));
    }

    /**
     * Paystack server-to-server webhook. Reachable without a JWT - see moodmate-gateway's
     * wallet-webhook-public route, added specifically for this path. Authenticity is established
     * by the HMAC-SHA512 signature in X-Paystack-Signature instead, verified inside the service
     * against the raw body below. The body MUST stay an unparsed String, not a DTO - the signature
     * is computed over Paystack's exact original bytes, and re-serializing through Jackson would
     * break it.
     */
    @PostMapping("/webhook")
    public void webhook(@RequestBody String rawBody,
                         @RequestHeader(value = "X-Paystack-Signature", required = false) String signature) {
        paymentsService.handleWebhook(rawBody, signature);
    }
}
