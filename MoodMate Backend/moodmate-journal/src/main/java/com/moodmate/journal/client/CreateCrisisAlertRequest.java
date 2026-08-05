package com.moodmate.journal.client;

import java.util.List;

/** Local copy of moodmate-crisis's request body shape for POST /internal/crisis/alerts. source is
 * a literal "JOURNAL" here (this service only ever creates alerts of that one source). */
public record CreateCrisisAlertRequest(Long userId, String triggerText, List<String> matchedKeywords,
                                        CrisisSeverity severity, String source) {
}
