package com.moodmate.backend.ai;

import com.moodmate.backend.ai.dto.AiChatMessageDto;
import com.moodmate.backend.ai.dto.AiChatRequest;
import com.moodmate.backend.ai.dto.AiChatResponse;
import com.moodmate.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * AI Chat endpoints — JWT-protected.
 *
 * POST   /api/ai/chat              — send a message (text / voice / image)
 * GET    /api/ai/chat/history      — recent messages (default last 50)
 * DELETE /api/ai/chat/history      — clear the user's chat history
 */
@RestController
@RequestMapping("/api/ai/chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService            chatService;
    private final AiChatMessageRepository  chatRepository;
    private final CurrentUser              currentUser;

    @PostMapping
    public ResponseEntity<AiChatResponse> sendMessage(@RequestBody AiChatRequest request) {
        return ResponseEntity.ok(chatService.chat(currentUser.id(), request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AiChatMessageDto>> getHistory(
            @RequestParam(defaultValue = "50") int size) {
        int capped = Math.min(size, 200);
        List<AiChatMessageDto> messages = chatRepository
                .findByUserIdOrderByCreatedAtDesc(currentUser.id(), PageRequest.of(0, capped))
                .stream()
                .map(AiChatMessageDto::from)
                // Return in chronological order for the chat UI
                .sorted((a, b) -> a.createdAt().compareTo(b.createdAt()))
                .toList();
        return ResponseEntity.ok(messages);
    }

    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory() {
        chatService.clearHistory(currentUser.id());
        return ResponseEntity.noContent().build();
    }
}
