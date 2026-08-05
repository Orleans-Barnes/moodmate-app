package com.moodmate.ai.service;

import com.moodmate.ai.client.GroqTranscriptionClient;
import com.moodmate.ai.dto.AudioTranscriptionRequest;
import com.moodmate.ai.dto.AudioTranscriptionResponse;
import com.moodmate.ai.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AiTranscriptionService {

    private static final int MAX_AUDIO_BYTES = 20 * 1024 * 1024;

    private final GroqTranscriptionClient client;

    public AudioTranscriptionResponse transcribe(AudioTranscriptionRequest request) {
        if (request.audioBase64() == null || request.audioBase64().isBlank()) {
            throw new ApiException("Audio recording is required.", HttpStatus.BAD_REQUEST);
        }

        byte[] audioBytes;
        try {
            audioBytes = Base64.getDecoder().decode(stripDataUriPrefix(request.audioBase64()));
        } catch (IllegalArgumentException e) {
            throw new ApiException("Audio recording could not be read.", HttpStatus.BAD_REQUEST);
        }

        if (audioBytes.length == 0) {
            throw new ApiException("Audio recording is empty.", HttpStatus.BAD_REQUEST);
        }
        if (audioBytes.length > MAX_AUDIO_BYTES) {
            throw new ApiException("Audio recording is too large. Please keep voice notes under 20 MB.", HttpStatus.BAD_REQUEST);
        }

        return new AudioTranscriptionResponse(client.transcribe(audioBytes, request.audioFilename()));
    }

    private String stripDataUriPrefix(String value) {
        int comma = value.indexOf(',');
        if (value.startsWith("data:") && comma >= 0) {
            return value.substring(comma + 1);
        }
        return value;
    }
}
