package com.moodmate.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** 1:1 with a user (user_id is UNIQUE) - a user has at most one subscription row, ever. */
@Entity
@Table(name = "user_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "plan_code", nullable = false)
    private String planCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.TRIALING;

    @Column(name = "trial_ends_at")
    private Instant trialEndsAt;

    @Column(name = "current_period_end")
    private Instant currentPeriodEnd;

    // Premium & Monetization (Milestone 3) - grace period. Set when SubscriptionExpiryJob moves an
    // ACTIVE subscription to PAST_DUE; the job later flips PAST_DUE -> EXPIRED once this passes.
    @Column(name = "grace_ends_at")
    private Instant graceEndsAt;

    @Column(name = "paystack_customer_code")
    private String paystackCustomerCode;

    @Column(name = "paystack_authorization_code")
    private String paystackAuthorizationCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
