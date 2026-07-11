package com.moodmate.backend.ai;

import com.moodmate.backend.ai.dto.InsightsResponse;
import com.moodmate.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/insights
 *
 * JWT-protected. Returns an AI-generated summary of the authenticated user's
 * recent mood check-ins and journal entries, powered by Groq.
 */
@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightsController {

    private final InsightsService insightsService;
    private final CurrentUser     currentUser;

    @GetMapping
    public ResponseEntity<InsightsResponse> getInsights() {
        return ResponseEntity.ok(insightsService.generateInsights(currentUser.id()));
    }
}
