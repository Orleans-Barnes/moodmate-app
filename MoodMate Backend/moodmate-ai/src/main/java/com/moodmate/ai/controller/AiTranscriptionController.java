package com.moodmate.ai.controller;

import com.moodmate.ai.dto.AudioTranscriptionRequest;
import com.moodmate.ai.dto.AudioTranscriptionResponse;
import com.moodmate.ai.service.AiTranscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/transcribe")
@RequiredArgsConstructor
public class AiTranscriptionController {

    private final AiTranscriptionService service;

    @PostMapping
    public AudioTranscriptionResponse transcribe(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody AudioTranscriptionRequest request) {
        return service.transcribe(request);
    }
}
