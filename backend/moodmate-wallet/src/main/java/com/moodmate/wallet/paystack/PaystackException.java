package com.moodmate.wallet.paystack;

import com.moodmate.wallet.exception.ApiException;
import org.springframework.http.HttpStatus;

/** Thrown when Paystack's API itself fails or returns something unusable - a 502, since the fault
 * is in an upstream dependency rather than the caller's request. */
public class PaystackException extends ApiException {
    public PaystackException(String message) {
        super(message, HttpStatus.BAD_GATEWAY);
    }
}
