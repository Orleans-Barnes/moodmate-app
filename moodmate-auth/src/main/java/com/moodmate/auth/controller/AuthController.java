package com.moodmate.auth.controller;

import com.moodmate.auth.dto.*;
import com.moodmate.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/guest")
    public ResponseEntity<AuthResponse> guest() {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.loginAsGuest());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
        // Always 200 with no body, regardless of whether the email matched an account - see
        // AuthService.forgotPassword's doc comment for why.
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.email(), req.otp(), req.newPassword());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin-setup")
    public ResponseEntity<AuthResponse> adminSetup(@Valid @RequestBody AdminSetupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.adminSetup(req));
    }

    /** Feature 4 - JWT Refresh Tokens. Rotates the presented refresh token for a new access token
     * + new refresh token. See AuthService.refresh()'s doc comment for the rotation/reuse-detection
     * contract. Deliberately public (no JwtAuthFilter) - see the gateway's auth-public route - a
     * client calling this has, by definition, an expired or soon-to-expire access token already. */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return ResponseEntity.ok(authService.refresh(req.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest req) {
        authService.logout(req.refreshToken());
        return ResponseEntity.ok().build();
    }
}
