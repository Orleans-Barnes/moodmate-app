package com.moodmate.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** New for Feature 11 (AI Safety Improvements).
 * disclaimerVersion is bumped whenever disclaimerText changes in a way that requires every user
 * to re-acknowledge (see DisclaimerAcknowledgement's doc comment) - a wording typo fix doesn't
 * need a bump, a substantive change to what the AI can/can't do does.
 * maxMessageLength / duplicateMessageWindowSeconds back the Abuse Protection guards in
 * AiChatService.sendMessage() - see its doc comment for the exact checks. */
@ConfigurationProperties(prefix = "moodmate.ai-safety")
public record AiSafetyProperties(String disclaimerText, int disclaimerVersion,
                                  int maxMessageLength, int duplicateMessageWindowSeconds) {
}
