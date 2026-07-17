package com.moodmate.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** New for Feature 9 (Notification Deep Linking). pushUrl is Expo's real push API by default -
 * kept configurable (not hardcoded), same reasoning as moodmate-wallet's paystack.base-url, so a
 * local/sandbox environment can point this at a mock server instead without a code change. */
@ConfigurationProperties(prefix = "moodmate.expo")
public record ExpoPushProperties(String pushUrl) {
}
