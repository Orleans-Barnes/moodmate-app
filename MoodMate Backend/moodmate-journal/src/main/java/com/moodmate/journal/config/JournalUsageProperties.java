package com.moodmate.journal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Free-tier journal entry cap (Premium Enforcement) - matches the "Basic journal (up to 10
 * entries)" line in the project's own business plan (MOODMATE_EXPANSION_PLAN.md). This is a
 * total-entries cap, not a daily one (unlike AI chat's cap) - see JournalService.create(). Pro
 * users are exempt. */
@ConfigurationProperties(prefix = "moodmate.journal-usage")
public record JournalUsageProperties(int freeEntryLimit) {
}
