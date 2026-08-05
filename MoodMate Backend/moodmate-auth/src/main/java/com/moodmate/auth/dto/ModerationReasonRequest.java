package com.moodmate.auth.dto;

/** Body for the internal ban/warn endpoints - see InternalUserController. reason is optional for
 * unban (ignored there) and required in practice for ban/warn, but validated by the caller
 * (moodmate-community's ModerationService) rather than with @NotBlank here, since the same record
 * is reused by unban where no reason applies. */
public record ModerationReasonRequest(String reason) {
}
