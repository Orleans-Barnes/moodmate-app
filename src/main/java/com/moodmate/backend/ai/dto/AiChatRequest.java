package com.moodmate.backend.ai.dto;

/**
 * Inbound payload for POST /api/ai/chat.
 *
 * Exactly one of (message, audioBase64, imageBase64) must be non-null.
 * For image messages, message is an optional caption.
 * audioFilename must include the file extension so Whisper can detect the codec
 * (e.g. "voice.m4a", "clip.webm").
 */
public record AiChatRequest(
        String message,
        String audioBase64,
        String imageBase64,
        String audioFilename
) {}
