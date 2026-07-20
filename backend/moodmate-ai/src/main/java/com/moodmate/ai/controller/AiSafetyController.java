package com.moodmate.ai.controller;

import com.moodmate.ai.dto.DisclaimerResponse;
import com.moodmate.ai.dto.UsageResponse;
import com.moodmate.ai.service.AiSafetyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** New for Feature 11 (AI Safety Improvements) - AI Disclaimer and Usage Tracking. Kept as a
 * separate controller from AiChatController (which is scoped to /api/ai/chat specifically) since
 * these are AI-service-wide safety/consent concerns, not chat-message operations. */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiSafetyController {

    private final AiSafetyService service;

    @GetMapping("/disclaimer")
    public DisclaimerResponse disclaimer(@RequestHeader("X-User-Id") Long userId) {
        return service.getDisclaimer(userId);
    }

    @PostMapping("/disclaimer/acknowledge")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acknowledgeDisclaimer(@RequestHeader("X-User-Id") Long userId) {
        service.acknowledgeDisclaimer(userId);
    }

    @GetMapping("/usage")
    public UsageResponse usage(@RequestHeader("X-User-Id") Long userId) {
        return service.getUsage(userId);
    }
}
