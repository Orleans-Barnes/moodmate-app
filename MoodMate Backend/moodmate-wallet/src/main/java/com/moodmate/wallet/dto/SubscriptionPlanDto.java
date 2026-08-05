package com.moodmate.wallet.dto;

import com.moodmate.wallet.entity.BillingInterval;

public record SubscriptionPlanDto(String code, String name, int pricePesewas, BillingInterval billingInterval,
                                   int trialDays) {
}
