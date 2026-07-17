package com.moodmate.wallet.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodmate.wallet.client.AuthServiceClient;
import com.moodmate.wallet.client.UserSummary;
import com.moodmate.wallet.dto.CheckoutResponse;
import com.moodmate.wallet.dto.LeafPackDto;
import com.moodmate.wallet.dto.PaymentTransactionDto;
import com.moodmate.wallet.dto.SubscriptionPlanDto;
import com.moodmate.wallet.dto.SubscriptionStateResponse;
import com.moodmate.wallet.entity.BillingInterval;
import com.moodmate.wallet.entity.LeafPack;
import com.moodmate.wallet.entity.LeafTransactionReason;
import com.moodmate.wallet.entity.PaymentPurpose;
import com.moodmate.wallet.entity.PaymentStatus;
import com.moodmate.wallet.entity.PaymentTransaction;
import com.moodmate.wallet.entity.SubscriptionPlan;
import com.moodmate.wallet.entity.SubscriptionStatus;
import com.moodmate.wallet.entity.UserSubscription;
import com.moodmate.wallet.exception.ApiException;
import com.moodmate.wallet.paystack.PaystackClient;
import com.moodmate.wallet.paystack.PaystackException;
import com.moodmate.wallet.paystack.PaystackInitializeResponse;
import com.moodmate.wallet.paystack.PaystackSignatureVerifier;
import com.moodmate.wallet.paystack.PaystackTransactionData;
import com.moodmate.wallet.paystack.PaystackWebhookEvent;
import com.moodmate.wallet.repository.LeafPackRepository;
import com.moodmate.wallet.repository.PaymentTransactionRepository;
import com.moodmate.wallet.repository.SubscriptionPlanRepository;
import com.moodmate.wallet.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestrates MoodMate Pro subscriptions and leaf-pack top-ups through Paystack (test mode - see
 * PaystackClient). Checkout flow for both purposes is identical: create a PENDING
 * PaymentTransaction with a unique reference, ask Paystack to initialize a transaction for that
 * reference, hand the client the hosted checkout URL. Fulfillment happens later, in
 * fulfillIfNeeded(), triggered by whichever arrives first - the Paystack webhook or the client
 * calling GET /verify/{reference} right after returning from checkout. Guarding on
 * status == PENDING makes fulfillment idempotent if both arrive.
 *
 * Differs from the monolith version only in where user identity and leaf-crediting come from:
 * user email is fetched from auth-service instead of a local `users` table, and leaves are
 * credited on this service's own LeafWallet instead of wellness's WellnessProfile.
 */
@Service
@RequiredArgsConstructor
public class PaymentsService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final LeafPackRepository leafPackRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final WalletService walletService;
    private final AuthServiceClient authServiceClient;
    private final PaystackClient paystackClient;
    private final PaystackSignatureVerifier paystackSignatureVerifier;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> listPlans() {
        return subscriptionPlanRepository.findAllByOrderByPricePesewasAsc().stream()
                .map(p -> new SubscriptionPlanDto(p.getCode(), p.getName(), p.getPricePesewas(), p.getBillingInterval(), p.getTrialDays()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeafPackDto> listLeafPacks() {
        return leafPackRepository.findAllByOrderBySortOrderAsc().stream()
                .map(p -> new LeafPackDto(p.getCode(), p.getLeaves(), p.getPricePesewas()))
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionStateResponse getSubscriptionState(Long userId) {
        return userSubscriptionRepository.findByUserId(userId)
                .map(this::toStateResponse)
                .orElseGet(SubscriptionStateResponse::none);
    }

    /** Free trial - no payment required. One per user, ever (user_id is unique on this table). */
    @Transactional
    public SubscriptionStateResponse startTrial(Long userId, String planCode) {
        if (userSubscriptionRepository.findByUserId(userId).isPresent()) {
            throw new ApiException("A subscription already exists for this account - trials can only be used once", HttpStatus.CONFLICT);
        }
        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(planCode)
                .orElseThrow(() -> new ApiException("Unknown subscription plan: " + planCode, HttpStatus.NOT_FOUND));

        UserSubscription sub = UserSubscription.builder()
                .userId(userId)
                .planCode(plan.getCode())
                .status(SubscriptionStatus.TRIALING)
                .trialEndsAt(Instant.now().plus(plan.getTrialDays(), ChronoUnit.DAYS))
                .build();
        userSubscriptionRepository.save(sub);

        return toStateResponse(sub);
    }

    @Transactional
    public CheckoutResponse checkoutSubscription(Long userId, String planCode) {
        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(planCode)
                .orElseThrow(() -> new ApiException("Unknown subscription plan: " + planCode, HttpStatus.NOT_FOUND));
        UserSummary user = authServiceClient.getUserSummary(userId);

        String reference = newReference("sub");
        paymentTransactionRepository.save(PaymentTransaction.builder()
                .userId(userId)
                .reference(reference)
                .purpose(PaymentPurpose.SUBSCRIPTION)
                .itemCode(plan.getCode())
                .amountPesewas(plan.getPricePesewas())
                .build());

        PaystackInitializeResponse.Data data = paystackClient.initializeTransaction(
                user.email(), plan.getPricePesewas(), reference,
                Map.of("purpose", "SUBSCRIPTION", "planCode", plan.getCode(), "userId", userId));

        return new CheckoutResponse(data.authorizationUrl(), data.reference());
    }

    @Transactional
    public CheckoutResponse checkoutLeafPack(Long userId, String packCode) {
        LeafPack pack = leafPackRepository.findByCode(packCode)
                .orElseThrow(() -> new ApiException("Unknown leaf pack: " + packCode, HttpStatus.NOT_FOUND));
        UserSummary user = authServiceClient.getUserSummary(userId);

        String reference = newReference("leaf");
        paymentTransactionRepository.save(PaymentTransaction.builder()
                .userId(userId)
                .reference(reference)
                .purpose(PaymentPurpose.LEAF_PACK)
                .itemCode(pack.getCode())
                .amountPesewas(pack.getPricePesewas())
                .build());

        PaystackInitializeResponse.Data data = paystackClient.initializeTransaction(
                user.email(), pack.getPricePesewas(), reference,
                Map.of("purpose", "LEAF_PACK", "packCode", pack.getCode(), "userId", userId));

        return new CheckoutResponse(data.authorizationUrl(), data.reference());
    }

    /** The client calls this right after returning from the Paystack checkout page, so fulfillment
     * doesn't depend solely on the webhook reaching us (handy in local/sandbox setups too). */
    @Transactional
    public PaymentTransactionDto verifyAndFulfill(Long userId, String reference) {
        PaymentTransaction tx = paymentTransactionRepository.findByReference(reference)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new ApiException("No such payment reference: " + reference, HttpStatus.NOT_FOUND));

        if (tx.getStatus() == PaymentStatus.PENDING) {
            PaystackTransactionData data = paystackClient.verifyTransaction(reference);
            tx = fulfillIfNeeded(tx, data);
        }

        return toDto(tx);
    }

    @Transactional
    public void handleWebhook(String rawBody, String signatureHeader) {
        if (!paystackSignatureVerifier.isValid(rawBody, signatureHeader)) {
            throw new ApiException("Invalid Paystack webhook signature", HttpStatus.UNAUTHORIZED);
        }

        PaystackWebhookEvent event;
        try {
            event = objectMapper.readValue(rawBody, PaystackWebhookEvent.class);
        } catch (JsonProcessingException e) {
            throw new ApiException("Malformed Paystack webhook payload", HttpStatus.BAD_REQUEST);
        }

        if (!"charge.success".equals(event.event()) || event.data() == null || event.data().reference() == null) {
            return; // other event types (or payloads we can't act on) are accepted but ignored
        }

        paymentTransactionRepository.findByReference(event.data().reference())
                .ifPresent(tx -> fulfillIfNeeded(tx, event.data()));
    }

    @Transactional(readOnly = true)
    public Page<PaymentTransactionDto> listMyTransactions(Long userId, Pageable pageable) {
        return paymentTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toDto);
    }

    /** Applies the result of a Paystack transaction exactly once - re-running this on an
     * already-resolved transaction (status no longer PENDING) is a safe no-op, which is what makes
     * it fine for both the webhook and the client-triggered verify call to race here. */
    private PaymentTransaction fulfillIfNeeded(PaymentTransaction tx, PaystackTransactionData data) {
        if (tx.getStatus() != PaymentStatus.PENDING) {
            return tx;
        }

        tx.setPaystackTransactionId(data.id());
        tx.setChannel(data.channel());
        tx.setPaidAt(parsePaystackInstant(data.paidAt()));

        boolean reportedSuccess = "success".equalsIgnoreCase(data.status());
        // Defend against a reference somehow being confirmed for a different amount than what we
        // initialized it for (e.g. tampering, or a stale/reused reference) - never credit on a
        // mismatch, even if Paystack reports "success".
        boolean amountMatches = data.amount() == null || data.amount() == tx.getAmountPesewas();

        if (!reportedSuccess || !amountMatches) {
            tx.setStatus(PaymentStatus.FAILED);
            return paymentTransactionRepository.save(tx);
        }

        tx.setStatus(PaymentStatus.SUCCESS);

        if (tx.getPurpose() == PaymentPurpose.SUBSCRIPTION) {
            activateSubscription(tx, data);
        } else {
            creditLeafPack(tx);
        }

        notifyPaymentSuccess(tx);

        return paymentTransactionRepository.save(tx);
    }

    /** Feature 9 (Notification Deep Linking) - Payment Callback Routing. Fires once, right after a
     * successful fulfillment (never on FAILED), whether that fulfillment was triggered by the
     * Paystack webhook or the client's own verify call - fulfillIfNeeded's PENDING guard already
     * makes this exactly-once regardless of which caller wins the race. authServiceClient.notify()
     * never throws (see its doc comment), so a notification failure can't roll back the payment
     * that already succeeded. */
    private void notifyPaymentSuccess(PaymentTransaction tx) {
        String title = tx.getPurpose() == PaymentPurpose.SUBSCRIPTION ? "MoodMate Pro activated" : "Leaves added";
        String body = tx.getPurpose() == PaymentPurpose.SUBSCRIPTION
                ? "Your MoodMate Pro subscription is now active."
                : "Your leaf pack purchase was successful.";
        authServiceClient.notify(tx.getUserId(), title, body,
                Map.of("screen", "Wallet", "reference", tx.getReference()));
    }

    private void activateSubscription(PaymentTransaction tx, PaystackTransactionData data) {
        SubscriptionPlan plan = subscriptionPlanRepository.findByCode(tx.getItemCode())
                .orElseThrow(() -> new PaystackException("Unknown plan code on transaction: " + tx.getItemCode()));

        UserSubscription sub = userSubscriptionRepository.findByUserId(tx.getUserId())
                .orElseGet(() -> UserSubscription.builder().userId(tx.getUserId()).build());

        Instant now = Instant.now();
        // Renewing before the current period ends extends from that end date, not from "now" -
        // otherwise paying early would forfeit the time already paid for.
        Instant base = sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now)
                ? sub.getCurrentPeriodEnd() : now;
        Instant newPeriodEnd = plan.getBillingInterval() == BillingInterval.YEAR
                ? base.plus(365, ChronoUnit.DAYS)
                : base.plus(30, ChronoUnit.DAYS);

        sub.setPlanCode(plan.getCode());
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setCurrentPeriodEnd(newPeriodEnd);
        if (data.customer() != null) {
            sub.setPaystackCustomerCode(data.customer().customerCode());
        }
        if (data.authorization() != null) {
            sub.setPaystackAuthorizationCode(data.authorization().authorizationCode());
        }

        userSubscriptionRepository.save(sub);
    }

    private void creditLeafPack(PaymentTransaction tx) {
        LeafPack pack = leafPackRepository.findByCode(tx.getItemCode())
                .orElseThrow(() -> new PaystackException("Unknown leaf pack code on transaction: " + tx.getItemCode()));

        // Reuses WalletService's own getOrCreate + credit + transaction-record logic instead of
        // duplicating it here, so a wallet created via a leaf-pack purchase gets the same default
        // equipped skin a wallet created via WalletService.getWalletState() would.
        walletService.creditLeaves(tx.getUserId(), pack.getLeaves(), LeafTransactionReason.LEAF_PACK_PURCHASE);
    }

    private SubscriptionStateResponse toStateResponse(UserSubscription sub) {
        boolean pro = sub.getStatus() == SubscriptionStatus.ACTIVE || sub.getStatus() == SubscriptionStatus.TRIALING;
        return new SubscriptionStateResponse(sub.getPlanCode(), sub.getStatus(), sub.getTrialEndsAt(),
                sub.getCurrentPeriodEnd(), pro);
    }

    private PaymentTransactionDto toDto(PaymentTransaction tx) {
        return new PaymentTransactionDto(tx.getReference(), tx.getPurpose(), tx.getItemCode(), tx.getAmountPesewas(),
                tx.getCurrency(), tx.getStatus(), tx.getPaidAt(), tx.getCreatedAt());
    }

    private String newReference(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "");
    }

    private Instant parsePaystackInstant(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(iso);
        } catch (DateTimeParseException e) {
            return Instant.now();
        }
    }
}
