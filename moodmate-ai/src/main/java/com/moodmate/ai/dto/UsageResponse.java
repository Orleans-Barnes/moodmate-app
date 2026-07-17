package com.moodmate.ai.dto;

/** New for Feature 11 (AI Safety Improvements) - Usage Tracking. Deliberately reuses Feature 3's
 * existing free-tier daily cap (AiUsageProperties/the same count query AiChatService already runs
 * before every send) rather than introducing a second, parallel usage-tracking mechanism - this
 * endpoint just makes that same number visible to the client proactively (so the app can show
 * "7/10 messages today" before the user hits the cap and gets a 402), instead of only surfacing it
 * reactively as an error. unlimited=true means dailyLimit/remaining aren't meaningful (Pro user or
 * the cap is disabled via free-daily-message-limit=0). */
public record UsageResponse(boolean pro, boolean unlimited, int messagesToday, int dailyLimit, int remainingToday) {
}
