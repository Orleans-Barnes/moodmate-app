package com.moodmate.ai.client;

import com.moodmate.ai.config.GroqProperties;
import com.moodmate.ai.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.client.MultipartBodyBuilder;

@Component
@RequiredArgsConstructor
public class GroqTranscriptionClient {

    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 45000;

    private final GroqProperties properties;

    public String transcribe(byte[] audioBytes, String filename) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new ApiException(
                    "Audio transcription is not configured - GROQ_API_KEY is not set on moodmate-ai.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        String safeFilename = filename == null || filename.isBlank() ? "voice-note.m4a" : filename;
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("model", properties.transcriptionModel());
        body.part("response_format", "json");
        body.part("file", new NamedByteArrayResource(audioBytes, safeFilename))
                .contentType(MediaType.APPLICATION_OCTET_STREAM);

        try {
            GroqTranscriptionResponse response = restClient().post()
                    .uri("/audio/transcriptions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body.build())
                    .retrieve()
                    .body(GroqTranscriptionResponse.class);

            if (response == null || response.text() == null || response.text().isBlank()) {
                throw new ApiException("No speech was detected in that recording.", HttpStatus.BAD_REQUEST);
            }
            return response.text().trim();
        } catch (ApiException e) {
            throw e;
        } catch (RestClientResponseException e) {
            String providerMessage = e.getResponseBodyAsString();
            if (providerMessage == null || providerMessage.isBlank()) {
                providerMessage = e.getStatusText();
            }
            throw new ApiException("Could not transcribe audio: " + providerMessage, HttpStatus.BAD_GATEWAY);
        } catch (RestClientException e) {
            throw new ApiException("Could not transcribe audio: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        } catch (RuntimeException e) {
            throw new ApiException("Could not transcribe audio. Please try again.", HttpStatus.BAD_GATEWAY);
        }
    }

    private RestClient restClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return RestClient.builder().baseUrl(properties.baseUrl()).requestFactory(factory).build();
    }

    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
