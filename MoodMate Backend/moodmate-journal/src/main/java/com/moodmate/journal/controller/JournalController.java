package com.moodmate.journal.controller;

import com.moodmate.journal.dto.FavoriteRequest;
import com.moodmate.journal.dto.JournalEntryRequest;
import com.moodmate.journal.dto.JournalEntryResponse;
import com.moodmate.journal.dto.UpdateTagsRequest;
import com.moodmate.journal.service.JournalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JournalEntryResponse create(@RequestHeader("X-User-Id") Long userId,
                                        @Valid @RequestBody JournalEntryRequest request) {
        return journalService.create(userId, request);
    }

    @GetMapping
    public Page<JournalEntryResponse> list(@RequestHeader("X-User-Id") Long userId,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return journalService.list(userId, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public JournalEntryResponse get(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return journalService.get(userId, id);
    }

    @PutMapping("/{id}")
    public JournalEntryResponse update(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                        @Valid @RequestBody JournalEntryRequest request) {
        return journalService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        journalService.delete(userId, id);
    }

    // Additive - not in the monolith, kept from the pre-existing service stub.
    @GetMapping("/count")
    public long count(@RequestHeader("X-User-Id") Long userId) {
        return journalService.count(userId);
    }

    /**
     * Feature 12 (Journal Improvements) - Search, Date Filters, Emotion Filters, Tags, Favorites.
     * New endpoint, additive alongside the existing plain GET /api/journal above (which is left
     * untouched). All filter params are optional and combine with AND. dateFrom/dateTo accept
     * ISO-8601 instants (e.g. 2026-07-01T00:00:00Z).
     */
    @GetMapping("/search")
    public Page<JournalEntryResponse> search(@RequestHeader("X-User-Id") Long userId,
                                              @RequestParam(required = false) String q,
                                              @RequestParam(required = false)
                                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateFrom,
                                              @RequestParam(required = false)
                                              @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateTo,
                                              @RequestParam(required = false) String emotion,
                                              @RequestParam(required = false) Boolean favorite,
                                              @RequestParam(required = false) String tag,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return journalService.search(userId, q, dateFrom, dateTo, emotion, favorite, tag, pageable);
    }

    // Feature 12 (Favorites). Explicit set-to-value - see FavoriteRequest's doc comment.
    @PutMapping("/{id}/favorite")
    public JournalEntryResponse setFavorite(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                             @Valid @RequestBody FavoriteRequest request) {
        return journalService.setFavorite(userId, id, request.favorite());
    }

    // Feature 12 (Tags). Replaces the entry's full tag set - see UpdateTagsRequest's doc comment.
    @PutMapping("/{id}/tags")
    public JournalEntryResponse updateTags(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                            @Valid @RequestBody UpdateTagsRequest request) {
        return journalService.updateTags(userId, id, request.tags());
    }

    // Feature 12 (Tags): distinct tags this user has used, for building a filter-chip UI.
    @GetMapping("/tags")
    public List<String> tags(@RequestHeader("X-User-Id") Long userId) {
        return journalService.listTags(userId);
    }
}
