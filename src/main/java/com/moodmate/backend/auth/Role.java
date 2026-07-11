package com.moodmate.backend.auth;

/**
 * Account type. Self-service signup ({@code AuthService.signup}) always assigns STUDENT -
 * a client can never request a different role. COUNSELLOR and ADMIN accounts are
 * provisioned out-of-band (see Phase 2/4 in IMPLEMENTATION_PLAN.md).
 */
public enum Role {
    STUDENT,
    COUNSELLOR,
    ADMIN
}
