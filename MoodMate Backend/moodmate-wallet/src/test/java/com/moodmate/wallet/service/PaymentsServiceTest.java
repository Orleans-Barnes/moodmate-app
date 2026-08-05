package com.moodmate.wallet.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodmate.wallet.client.AuthServiceClient;
import com.moodmate.wallet.client.InstitutionServiceClient;
import com.moodmate.wallet.entity.LeafPack;
import com.moodmate.wallet.entity.PaymentPurpose;
import com.moodmate.wallet.entity.PaymentStatus;
import com.moodmate.wallet.entity.PaymentTransaction;
import com.moodmate.wallet.entity.SubscriptionPlan;
import com.moodmate.wallet.entity.BillingInterval;
import com.moodmate.wallet.paystack.PaystackClient;
import com.moodmate.wallet.paystack.PaystackSignatureVerifier;
import com.moodmate.wallet.repository.BookRepository;
import com.moodmate.wallet.repository.LeafPackRepository;
import com.moodmate.wallet.repository.PaymentTransactionRepository;
import com.moodmate.wallet.repository.SubscriptionPlanRepository;
import com.moodmate.wallet.repository.UserOwnedBookRepository;
import com.moodmate.wallet.repository.UserSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Covers Feature 9's Payment Callback Routing: a successful webhook-driven fulfillment must
 * notify the payer exactly once, with a "screen": "Wallet" data payload; a FAILED fulfillment
 * (non-success Paystack status) or an invalid signature must not notify at all. Other
 * PaymentsService behavior (checkout, verify, idempotent PENDING guard) is pre-existing and out
 * of this feature's scope. */
class PaymentsServiceTest {

    private PaymentTransactionRepository paymentTransactionRepository;
    private LeafPackRepository leafPackRepository;
    private SubscriptionPlanRepository subscriptionPlanRepository;
    private UserSubscriptionRepository userSubscriptionRepository;
    private WalletService walletService;
    private AuthServiceClient authServiceClient;
    private PaystackSignatureVerifier signatureVerifier;
    private PaymentsService service;

    @BeforeEach
    void setUp() {
        subscriptionPlanRepository = mock(SubscriptionPlanRepository.class);
        userSubscriptionRepository = mock(UserSubscriptionRepository.class);
        leafPackRepository = mock(LeafPackRepository.class);
        // Wellness Library - Books. Not exercised by any test in this class (all three existing
        // tests cover LEAF_PACK/SUBSCRIPTION purposes only) - mocked purely so the constructor
        // call below keeps compiling as PaymentsService's field list grows.
        BookRepository bookRepository = mock(BookRepository.class);
        UserOwnedBookRepository userOwnedBookRepository = mock(UserOwnedBookRepository.class);
        paymentTransactionRepository = mock(PaymentTransactionRepository.class);
        walletService = mock(WalletService.class);
        authServiceClient = mock(AuthServiceClient.class);
        // Institution Management (Milestone 2, Step 3-4) added institutionServiceClient the same
        // way this test's authServiceClient was already mocked - not exercised by any test here
        // (userSubscriptionRepository.findByUserId is stubbed empty below, and
        // authServiceClient.getInstitutionId defaults to null unstubbed, so
        // institutionLicenseCoversUser short-circuits to false without ever reaching this mock).
        InstitutionServiceClient institutionServiceClient = mock(InstitutionServiceClient.class);
        PaystackClient paystackClient = mock(PaystackClient.class);
        signatureVerifier = mock(PaystackSignatureVerifier.class);
        ObjectMapper objectMapper = new ObjectMapper();

        service = new PaymentsService(subscriptionPlanRepository, userSubscriptionRepository, leafPackRepository,
                bookRepository, userOwnedBookRepository,
                paymentTransactionRepository, walletService, authServiceClient, institutionServiceClient,
                paystackClient, signatureVerifier, objectMapper);

        when(userSubscriptionRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(userSubscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(paymentTransactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void successfulLeafPackWebhookNotifiesTheBuyerWithWalletScreen() {
        when(signatureVerifier.isValid(anyString(), anyString())).thenReturn(true);

        PaymentTransaction tx = PaymentTransaction.builder().id(1L).userId(42L).reference("leaf_abc")
                .purpose(PaymentPurpose.LEAF_PACK).itemCode("PACK_S").amountPesewas(500)
                .status(PaymentStatus.PENDING).build();
        when(paymentTransactionRepository.findByReference("leaf_abc")).thenReturn(Optional.of(tx));
        when(leafPackRepository.findByCode("PACK_S")).thenReturn(Optional.of(
                LeafPack.builder().id(1L).code("PACK_S").leaves(100).pricePesewas(500).build()));

        String rawBody = """
                {"event":"charge.success","data":{"id":999,"status":"success","reference":"leaf_abc","amount":500,"paid_at":"2026-01-01T00:00:00.000Z"}}""";

        service.handleWebhook(rawBody, "any-signature");

        verify(authServiceClient, times(1)).notify(eq(42L), eq("Leaves added"),
                eq("Your leaf pack purchase was successful."), eq(Map.of("screen", "Wallet", "reference", "leaf_abc")));
        verify(walletService).creditLeaves(eq(42L), eq(100), any());
    }

    @Test
    void successfulSubscriptionWebhookNotifiesWithProActivatedMessage() {
        when(signatureVerifier.isValid(anyString(), anyString())).thenReturn(true);

        PaymentTransaction tx = PaymentTransaction.builder().id(2L).userId(7L).reference("sub_abc")
                .purpose(PaymentPurpose.SUBSCRIPTION).itemCode("PRO_MONTHLY").amountPesewas(1000)
                .status(PaymentStatus.PENDING).build();
        when(paymentTransactionRepository.findByReference("sub_abc")).thenReturn(Optional.of(tx));
        SubscriptionPlan plan = SubscriptionPlan.builder().id(1L).code("PRO_MONTHLY").name("Pro Monthly")
                .pricePesewas(1000).billingInterval(BillingInterval.MONTH).trialDays(0).build();
        when(subscriptionPlanRepository.findByCode("PRO_MONTHLY")).thenReturn(Optional.of(plan));

        String rawBody = """
                {"event":"charge.success","data":{"id":998,"status":"success","reference":"sub_abc","amount":1000,"paid_at":"2026-01-01T00:00:00.000Z"}}""";

        service.handleWebhook(rawBody, "any-signature");

        verify(authServiceClient, times(1)).notify(eq(7L), eq("MoodMate Pro activated"),
                eq("Your MoodMate Pro subscription is now active."), eq(Map.of("screen", "Wallet", "reference", "sub_abc")));
    }

    @Test
    void failedFulfillmentDoesNotNotify() {
        when(signatureVerifier.isValid(anyString(), anyString())).thenReturn(true);

        PaymentTransaction tx = PaymentTransaction.builder().id(3L).userId(42L).reference("leaf_bad")
                .purpose(PaymentPurpose.LEAF_PACK).itemCode("PACK_S").amountPesewas(500)
                .status(PaymentStatus.PENDING).build();
        when(paymentTransactionRepository.findByReference("leaf_bad")).thenReturn(Optional.of(tx));

        String rawBody = """
                {"event":"charge.success","data":{"id":997,"status":"failed","reference":"leaf_bad","amount":500,"paid_at":"2026-01-01T00:00:00.000Z"}}""";

        service.handleWebhook(rawBody, "any-signature");

        verify(authServiceClient, never()).notify(any(), any(), any(), any());
    }

    @Test
    void invalidSignatureDoesNotNotify() {
        when(signatureVerifier.isValid(anyString(), anyString())).thenReturn(false);

        try {
            service.handleWebhook("{}", "bad-signature");
        } catch (RuntimeException ignored) {
            // handleWebhook throws ApiException(UNAUTHORIZED) on a bad signature - expected here.
        }

        verify(authServiceClient, never()).notify(any(), any(), any(), any());
    }
}
