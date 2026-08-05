package com.moodmate.community.client;

/** Local copy of moodmate-auth's ModerationReasonRequest shape - the outgoing request body for
 * AuthServiceClient's ban/warn calls. */
public record ModerationReasonBody(String reason) {
}
