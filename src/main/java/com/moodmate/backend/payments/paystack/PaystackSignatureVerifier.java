package com.moodmate.backend.payments.paystack;

import com.moodmate.backend.config.PaystackProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Verifies the `x-paystack-signature` header Paystack sends on every webhook call: HMAC-SHA512 of
 * the raw request body, keyed with our Paystack secret key, hex-encoded. Must run against the
 * exact raw bytes Paystack sent - never against a re-serialized version of a parsed object, since
 * Jackson's output can differ byte-for-byte from the original and break the signature.
 */
@Component
@RequiredArgsConstructor
public class PaystackSignatureVerifier {

    private static final String HMAC_ALGORITHM = "HmacSHA512";

    private final PaystackProperties paystackProperties;

    public boolean isValid(String rawBody, String signatureHeader) {
        if (rawBody == null || signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }

        String secretKey = paystackProperties.secretKey();
        if (secretKey == null || secretKey.isBlank()) {
            // No secret configured (e.g. local dev without Paystack set up yet) - fail closed.
            return false;
        }

        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] computedBytes = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computedHex = HexFormat.of().formatHex(computedBytes);
            return MessageDigest.isEqual(
                    computedHex.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HmacSHA512 is unavailable in this JVM", e);
        }
    }
}
