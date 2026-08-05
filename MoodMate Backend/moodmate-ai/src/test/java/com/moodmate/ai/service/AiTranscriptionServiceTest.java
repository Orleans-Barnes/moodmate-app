package com.moodmate.ai.service;

import com.moodmate.ai.client.GroqTranscriptionClient;
import com.moodmate.ai.dto.AudioTranscriptionRequest;
import com.moodmate.ai.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AiTranscriptionServiceTest {

    private GroqTranscriptionClient client;
    private AiTranscriptionService service;

    @BeforeEach
    void setUp() {
        client = mock(GroqTranscriptionClient.class);
        service = new AiTranscriptionService(client);
    }

    @Test
    void rejectsMissingAudioBeforeProviderCall() {
        ApiException ex = assertThrows(ApiException.class,
                () -> service.transcribe(new AudioTranscriptionRequest("", "voice.m4a")));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verifyNoInteractions(client);
    }

    @Test
    void rejectsInvalidBase64BeforeProviderCall() {
        ApiException ex = assertThrows(ApiException.class,
                () -> service.transcribe(new AudioTranscriptionRequest("not-base64", "voice.m4a")));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verifyNoInteractions(client);
    }

    @Test
    void decodesAudioAndReturnsProviderTranscript() {
        String audioBase64 = Base64.getEncoder().encodeToString("audio".getBytes(StandardCharsets.UTF_8));
        when(client.transcribe(any(byte[].class), eq("voice.m4a"))).thenReturn("I feel calmer now.");

        var response = service.transcribe(new AudioTranscriptionRequest(audioBase64, "voice.m4a"));

        assertEquals("I feel calmer now.", response.text());
        verify(client).transcribe(any(byte[].class), eq("voice.m4a"));
    }
}
