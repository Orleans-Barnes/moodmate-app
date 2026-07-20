package com.moodmate.journal.controller;

import com.moodmate.journal.dto.GratitudeEntryRequest;
import com.moodmate.journal.dto.GratitudeEntryResponse;
import com.moodmate.journal.service.GratitudeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Separate controller at /api/gratitude (matching the monolith exactly, and the gateway's
 * journal-service route which forwards both /api/journal/** and /api/gratitude/**). The
 * pre-existing stub nested this under /api/journal/gratitude/** instead - the gateway's
 * /api/gratitude/** predicate would never have matched any real endpoint here.
 */
@RestController
@RequestMapping("/api/gratitude")
@RequiredArgsConstructor
public class GratitudeController {

    private final GratitudeService gratitudeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GratitudeEntryResponse create(@RequestHeader("X-User-Id") Long userId,
                                          @Valid @RequestBody GratitudeEntryRequest request) {
        return gratitudeService.create(userId, request);
    }

    @GetMapping
    public Page<GratitudeEntryResponse> list(@RequestHeader("X-User-Id") Long userId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return gratitudeService.list(userId, PageRequest.of(page, size));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        gratitudeService.delete(userId, id);
    }
}
