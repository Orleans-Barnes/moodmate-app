package com.moodmate.auth.profile.validation;

import com.moodmate.auth.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Phase 1C-i. Single place that turns a raw String (or Set<String>) from a request body into a
 * validated enum constant — an unrecognized value is rejected with 400, never silently stored.
 * Extracted out of StudentProfileService so both profile services (and any future ones, e.g. a
 * later PeerMentorProfile) share the exact same validation behaviour instead of each
 * reimplementing Enum.valueOf() + try/catch.
 */
public final class EnumValidator {

    private EnumValidator() {}

    public static <E extends Enum<E>> E parse(Class<E> type, String raw, String fieldName) {
        try {
            return Enum.valueOf(type, raw);
        } catch (IllegalArgumentException ex) {
            throw new ApiException("Invalid " + fieldName + ": " + raw, HttpStatus.BAD_REQUEST);
        }
    }

    public static <E extends Enum<E>> Set<E> parseSet(Class<E> type, Set<String> raw, String fieldName) {
        return raw.stream()
                .map(v -> parse(type, v, fieldName))
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(type)));
    }
}
