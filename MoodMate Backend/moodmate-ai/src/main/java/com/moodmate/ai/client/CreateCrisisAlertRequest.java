package com.moodmate.ai.client;

import java.util.List;

/** Local copy of moodmate-crisis's request body shape for POST /internal/crisis/alerts. source is
 * a literal "AI_CHAT" here (this service only ever creates alerts of that one source), so it's
 * sent as a plain String rather than a local copy of moodmate-crisis's CrisisSource enum. */
public record CreateCrisisAlertRequest(Long userId, String triggerText, List<String> matchedKeywords,
                                        CrisisSeverity severity, String source) {
}
