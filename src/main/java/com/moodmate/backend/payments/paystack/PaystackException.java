package com.moodmate.backend.payments.paystack;

import com.moodmate.backend.common.exception.ApiException;
import org.springframework.http.HttpStatus;

/** Thrown when Paystack's API itself fails or returns something we can't use - a 502, since the
 * fault is in our upstream dependency rather than the caller's request. */
public class PaystackException extends ApiException {
    public PaystackException(String message) {
        super(HttpStatus.BAD_GATEWAY, message);
    }
}
