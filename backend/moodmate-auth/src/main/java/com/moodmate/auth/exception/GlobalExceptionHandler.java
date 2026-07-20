package com.moodmate.auth.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException e, HttpServletRequest request) {
        return build(e.getStatus(), e.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e,
                                                                  HttpServletRequest request) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst().map(f -> f.getField() + ": " + f.getDefaultMessage())
                .orElse("Validation failed");
        return build(HttpStatus.BAD_REQUEST, msg, request);
    }

    // A concurrent signup racing on the same email (or any other unique-constraint clash) used to
    // fall through to handleGeneral() below and come back as a misleading 500. This maps it to a
    // clean 409 instead, and stops it from being logged at error level for every occurrence.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(DataIntegrityViolationException e,
                                                                HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "This action conflicts with existing data", request);
    }

    // Phase 1C-i.5 hardening: a malformed/unparseable JSON body (or a request body missing
    // entirely where one is required) used to fall through to handleGeneral() and come back as a
    // misleading 500 - same class of bug the DataIntegrityViolationException handler above fixed
    // for unique-constraint clashes. Now a clean 400 instead.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(HttpMessageNotReadableException e,
                                                                      HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Request body is missing or malformed", request);
    }

    // Phase 1C-i.6: two concurrent PUTs to the same StudentProfile/WellnessPreference row (both
    // read the same @Version, both try to write) - the second one to commit gets this exception
    // from Hibernate instead of silently overwriting the first writer's change. Mapped to 409
    // ("someone else changed this since you last read it"), not 500 - the client is expected to
    // re-fetch and retry, same as any other optimistic-concurrency API.
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLock(OptimisticLockingFailureException e,
                                                                      HttpServletRequest request) {
        return build(HttpStatus.CONFLICT,
                "This profile was updated elsewhere since you last loaded it - please refresh and try again",
                request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception e, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message, HttpServletRequest request) {
        Map<String, Object> body = Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message,
                "path", request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
