package com.moodmate.wallet.entity;

public enum PaymentPurpose {
    SUBSCRIPTION,
    LEAF_PACK,
    // Wellness Library - Books. Same generic PaymentTransaction/PaystackClient path as the other
    // two purposes (see PaymentsService's own doc comment) - itemCode holds the book's code.
    BOOK
}
