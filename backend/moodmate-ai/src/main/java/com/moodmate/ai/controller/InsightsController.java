package com.moodmate.ai.controller;

import com.moodmate.ai.dto.InsightsResponse;
import com.moodmate.ai.service.InsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightsController {

    private final InsightsService service;

    @GetMapping
    public InsightsResponse getInsights(@RequestHeader("X-User-Id") Long userId) {
        return service.getInsights(userId);
    }
}
