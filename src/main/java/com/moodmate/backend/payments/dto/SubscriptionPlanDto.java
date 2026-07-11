package com.moodmate.backend.payments.dto;

import com.moodmate.backend.payments.BillingInterval;

public record SubscriptionPlanDto(String code, String name, int pricePesewas, BillingInterval billingInterval,
                                   int trialDays) {
}
