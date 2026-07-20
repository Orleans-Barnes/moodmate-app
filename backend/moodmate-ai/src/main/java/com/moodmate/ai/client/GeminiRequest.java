package com.moodmate.ai.client;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/** systemInstruction is nullable - @JsonInclude(NON_NULL) here (this service's Jackson config
 * doesn't set default-property-inclusion, so without this a null field would serialize as
 * "systemInstruction":null) ensures it's omitted entirely rather than sent as null, matching
 * Gemini's own docs (the field is optional - omit, don't null it). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GeminiRequest(
        GeminiSystemInstruction systemInstruction,
        List<GeminiContent> contents,
        GeminiGenerationConfig generationConfig) {
}
