package com.moodmate.wellness.controller;

import com.moodmate.wellness.dto.ArticleResponse;
import com.moodmate.wellness.dto.EventResponse;
import com.moodmate.wellness.service.HubService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
}
