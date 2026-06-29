package com.moodmate.backend.payments;

import com.moodmate.backend.payments.dto.CheckoutResponse;
import com.moodmate.backend.payments.dto.LeafPackCheckoutRequest;
import com.moodmate.backend.payments.dto.LeafPackDto;
import com.moodmate.backend.payments.dto.PaymentTransactionDto;
import com.moodmate.backend.payments.dto.SubscriptionCheckoutRequest;
import com.moodmate.backend.payments.dto.SubscriptionPlanDto;
import com.moodmate.backend.payments.dto.SubscriptionStateResponse;
import com.moodmate.backend.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentsController {

    private final PaymentsService paymentsService;
    private final CurrentUser currentUser;

    @GetMapping("/plans")
    public List<SubscriptionPlanDto> plans() {
        return paymentsService.listPlans();
    }

    @GetMapping("/leaf-packs")
    public List<LeafPackDto> leafPacks() {
        return paymentsService.listLeafPacks();
    }

    @GetMapping("/subscription")
    public SubscriptionStateResponse subscription() {
        return paymentsService.getSubscriptionState(currentUser.id());
    }

    @PostMapping("/subscription/trial")
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionStateResponse startTrial(@Valid @RequestBody SubscriptionCheckoutRequest request) {
        return paymentsService.startTrial(currentUser.id(), request.planCode());
    }

    @PostMapping("/subscription/checkout")
    public CheckoutResponse checkoutSubscription(@Valid @RequestBody SubscriptionCheckoutRequest request) {
        return paymentsService.checkoutSubscription(currentUser.id(), request.planCode());
    }

    @PostMapping("/leaf-packs/checkout")
    public CheckoutResponse checkoutLeafPack(@Valid @RequestBody LeafPackCheckoutRequest request) {
        return paymentsService.checkoutLeafPack(currentUser.id(), request.packCode());
    }

    /** Client calls this immediately after returning from the Paystack checkout page. */
    @GetMapping("/verify/{reference}")
    public PaymentTransactionDto verify(@PathVariable String reference) {
        return paymentsService.verifyAndFulfill(currentUser.id(), reference);
    }

    @GetMapping("/transactions")
    public Page<PaymentTransactionDto> transactions(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        return paymentsService.listMyTransactions(currentUser.id(), PageRequest.of(page, size));
    }

    /**
     * Paystack server-to-server webhook. Public (see SecurityConfig.PUBLIC_ENDPOINTS) because
     * Paystack can't supply a user JWT - authenticity is established by the HMAC-SHA512 signature
     * in X-Paystack-Signature instead, verified inside the service against the raw body below.
     * The body MUST stay an unparsed String, not a DTO - the signature is computed over Paystack's
     * exact original bytes, and re-serializing through Jackson would break it.
     */
    @PostMapping("/webhook")
    public void webhook(@RequestBody String rawBody,
                         @RequestHeader(value = "X-Paystack-Signature", required = false) String signature) {
        paymentsService.handleWebhook(rawBody, signature);
    }
}
