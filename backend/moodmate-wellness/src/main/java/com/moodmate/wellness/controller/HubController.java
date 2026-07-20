package com.moodmate.wellness.controller;

import com.moodmate.wellness.dto.ArticleResponse;
import com.moodmate.wellness.dto.CreateArticleRequest;
import com.moodmate.wellness.dto.CreateEventRequest;
import com.moodmate.wellness.dto.EventResponse;
import com.moodmate.wellness.dto.UpdateArticleRequest;
import com.moodmate.wellness.dto.UpdateEventRequest;
import com.moodmate.wellness.exception.ApiException;
import com.moodmate.wellness.service.HubService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hub")
@RequiredArgsConstructor
public class HubController {

    private final HubService hubService;

    @GetMapping("/articles")
    public Page<ArticleResponse> articles(@RequestParam(required = false) String category,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return hubService.listArticles(category, PageRequest.of(page, size));
    }

    @GetMapping("/articles/{id}")
    public ArticleResponse article(@PathVariable Long id) {
        return hubService.getArticle(id);
    }

    @GetMapping("/events")
    public Page<EventResponse> events(@RequestHeader("X-User-Id") Long userId,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return hubService.listEvents(userId, PageRequest.of(page, size));
    }

    @GetMapping("/events/mine")
    public List<EventResponse> myEvents(@RequestHeader("X-User-Id") Long userId) {
        return hubService.myRsvps(userId);
    }

    @PostMapping("/events/{id}/rsvp")
    public EventResponse rsvp(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return hubService.rsvp(userId, id);
    }

    @PostMapping("/events/{id}/rsvp/cancel")
    public EventResponse cancelRsvp(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return hubService.cancelRsvp(userId, id);
    }

    // ── Phase 1H (Admin Portal - Wellness Content) - admin-only writes. Everything above this
    // point is the pre-existing read-only surface; nothing above was touched. ──────────────────────

    @PostMapping("/articles")
    @ResponseStatus(HttpStatus.CREATED)
    public ArticleResponse createArticle(@RequestHeader("X-User-Role") String role,
                                          @Valid @RequestBody CreateArticleRequest request) {
        requireAdmin(role);
        return hubService.createArticle(request);
    }

    @PatchMapping("/articles/{id}")
    public ArticleResponse updateArticle(@RequestHeader("X-User-Role") String role,
                                          @PathVariable Long id,
                                          @RequestBody UpdateArticleRequest request) {
        requireAdmin(role);
        return hubService.updateArticle(id, request);
    }

    @DeleteMapping("/articles/{id}")
    public void deleteArticle(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        hubService.deleteArticle(id);
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(@RequestHeader("X-User-Role") String role,
                                      @Valid @RequestBody CreateEventRequest request) {
        requireAdmin(role);
        return hubService.createEvent(request);
    }

    @PatchMapping("/events/{id}")
    public EventResponse updateEvent(@RequestHeader("X-User-Role") String role,
                                      @PathVariable Long id,
                                      @RequestBody UpdateEventRequest request) {
        requireAdmin(role);
        return hubService.updateEvent(id, request);
    }

    @DeleteMapping("/events/{id}")
    public void deleteEvent(@RequestHeader("X-User-Role") String role, @PathVariable Long id) {
        requireAdmin(role);
        hubService.deleteEvent(id);
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ApiException("Admin access required", HttpStatus.FORBIDDEN);
        }
    }
}
