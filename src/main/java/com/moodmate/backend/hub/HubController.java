package com.moodmate.backend.hub;

import com.moodmate.backend.hub.dto.ArticleResponse;
import com.moodmate.backend.hub.dto.EventResponse;
import com.moodmate.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hub")
@RequiredArgsConstructor
public class HubController {

    private final HubService hubService;
    private final CurrentUser currentUser;

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
    public Page<EventResponse> events(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return hubService.listEvents(currentUser.id(), PageRequest.of(page, size));
    }

    @GetMapping("/events/mine")
    public List<EventResponse> myEvents() {
        return hubService.myRsvps(currentUser.id());
    }

    @PostMapping("/events/{id}/rsvp")
    public EventResponse rsvp(@PathVariable Long id) {
        return hubService.rsvp(currentUser.id(), id);
    }

    @PostMapping("/events/{id}/rsvp/cancel")
    public EventResponse cancelRsvp(@PathVariable Long id) {
        return hubService.cancelRsvp(currentUser.id(), id);
    }
}
