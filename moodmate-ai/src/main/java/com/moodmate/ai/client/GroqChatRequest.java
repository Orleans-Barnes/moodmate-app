package com.moodmate.ai.client;

import java.util.List;

public record GroqChatRequest(String model, List<GroqMessage> messages, double temperature, int max_tokens) {
}
