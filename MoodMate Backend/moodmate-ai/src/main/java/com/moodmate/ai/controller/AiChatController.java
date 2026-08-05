package com.moodmate.ai.controller;

import com.moodmate.ai.dto.AiChatMessageDto;
import com.moodmate.ai.dto.AiChatRequest;
import com.moodmate.ai.dto.AiChatResponse;
import com.moodmate.ai.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService service;

    @PostMapping
    public AiChatResponse send(@RequestHeader("X-User-Id") Long userId, @RequestBody AiChatRequest request) {
        return service.sendMessage(userId, request);
    }

    @GetMapping("/history")
    public List<AiChatMessageDto> history(@RequestHeader("X-User-Id") Long userId,
                                           @RequestParam(defaultValue = "50") int size) {
        return service.history(userId, size);
    }

    @DeleteMapping("/history")
    public void clearHistory(@RequestHeader("X-User-Id") Long userId) {
        service.clearHistory(userId);
    }
}
