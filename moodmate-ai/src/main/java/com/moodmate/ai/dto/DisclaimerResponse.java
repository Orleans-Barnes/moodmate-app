package com.moodmate.ai.dto;

import java.time.Instant;

/** acknowledged reflects the CURRENT disclaimerVersion specifically - a user who acknowledged an
 * older version (before a substantive wording change bumped the version) shows acknowledged=false
 * again, same as someone who never acknowledged at all. acknowledgedAt is null in that case too. */
public record DisclaimerResponse(String text, int version, boolean acknowledged, Instant acknowledgedAt) {
}
