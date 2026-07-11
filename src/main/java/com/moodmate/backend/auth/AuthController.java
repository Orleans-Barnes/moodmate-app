package com.moodmate.backend.auth;

import com.moodmate.backend.auth.dto.AdminSetupRequest;
import com.moodmate.backend.auth.dto.AuthResponse;
import com.moodmate.backend.auth.dto.ForgotPasswordRequest;
import com.moodmate.backend.auth.dto.LoginRequest;
import com.moodmate.backend.auth.dto.ResetPasswordRequest;
import com.moodmate.backend.auth.dto.SignupRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/guest")
    public ResponseEntity<AuthResponse> guest() {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.loginAsGuest());
    }

    /**
     * One-shot admin bootstrap — available only while no ADMIN account exists.
     * Self-sealing: returns 409 the moment an admin exists, so it cannot be
     * used to create a second admin. No JWT required (it's under /api/auth/**).
     */
    @PostMapping("/admin-setup")
    public ResponseEntity<AuthResponse> adminSetup(@Valid @RequestBody AdminSetupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.adminSetup(request));
    }

    /**
     * Sends a 6-digit OTP to the given email address.
     * Always returns 200 to prevent user enumeration (email may or may not exist).
     */
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.OK)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
    }

    /**
     * Validates the OTP and sets a new password. Returns 400 for invalid/expired codes.
     */
    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.OK)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
    }
}
