package com.moodmate.backend.common.exception;

import org.springframework.http.HttpStatus;

/** Base type for all exceptions that should be translated straight into an HTTP error response. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
