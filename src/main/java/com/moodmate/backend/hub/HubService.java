package com.moodmate.backend.hub;

import com.moodmate.backend.common.exception.ConflictException;
import com.moodmate.backend.common.exception.ResourceNotFoundException;
import com.moodmate.backend.hub.dto.ArticleResponse;
import com.moodmate.backend.hub.dto.EventResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HubService {

    private final WellnessArticleRepository articleRepository;
    private final WellnessEventRepository eventRepository;
    private final EventRsvpRepository eventRsvpRepository;

    @Transactional(readOnly = true)
    public Page<ArticleResponse> listArticles(String category, Pageable pageable) {
        Page<WellnessArticle> articles = StringUtils.hasText(category)
                ? articleRepository.findByCategoryOrderByPublishedAtDesc(category, pageable)
                : articleRepository.findAllByOrderByPublishedAtDesc(pageable);
        return articles.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ArticleResponse getArticle(Long articleId) {
        return articleRepository.findById(articleId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + articleId));
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listEvents(Long userId, Pageable pageable) {
        Page<WellnessEvent> events = eventRepository.findAllByOrderByStartsAtAsc(pageable);

        List<Long> eventIds = events.getContent().stream().map(WellnessEvent::getId).toList();
        Map<Long, List<EventRsvp>> rsvpsByEvent = eventIds.isEmpty()
                ? Map.of()
                : eventRsvpRepository.findByEventIdIn(eventIds).stream()
                        .collect(Collectors.groupingBy(EventRsvp::getEventId));

        return events.map(event -> toResponse(event, rsvpsByEvent.getOrDefault(event.getId(), List.of()), userId));
    }

    @Transactional
    public EventResponse rsvp(Long userId, Long eventId) {
        WellnessEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        boolean alreadyRsvped = eventRsvpRepository.findByEventIdAndUserId(eventId, userId).isPresent();
        if (!alreadyRsvped) {
            long currentCount = eventRsvpRepository.countByEventId(eventId);
            if (event.getCapacity() != null && currentCount >= event.getCapacity()) {
                throw new ConflictException("This event is full");
            }
            eventRsvpRepository.save(EventRsvp.builder()
                    .eventId(eventId)
                    .userId(userId)
                    .createdAt(Instant.now())
                    .build());
        }

        return toResponse(event, eventRsvpRepository.findByEventIdIn(List.of(eventId)), userId);
    }

    @Transactional
    public EventResponse cancelRsvp(Long userId, Long eventId) {
        WellnessEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        eventRsvpRepository.findByEventIdAndUserId(eventId, userId).ifPresent(eventRsvpRepository::delete);

        return toResponse(event, eventRsvpRepository.findByEventIdIn(List.of(eventId)), userId);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> myRsvps(Long userId) {
        List<EventRsvp> mine = eventRsvpRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Long> eventIds = mine.stream().map(EventRsvp::getEventId).toList();
        if (eventIds.isEmpty()) {
            return List.of();
        }

        Map<Long, WellnessEvent> eventsById = eventRepository.findAllById(eventIds).stream()
                .collect(Collectors.toMap(WellnessEvent::getId, e -> e));
        Map<Long, List<EventRsvp>> rsvpsByEvent = eventRsvpRepository.findByEventIdIn(eventIds).stream()
                .collect(Collectors.groupingBy(EventRsvp::getEventId));

        return eventIds.stream()
                .map(eventsById::get)
                .filter(java.util.Objects::nonNull)
                .map(event -> toResponse(event, rsvpsByEvent.getOrDefault(event.getId(), List.of()), userId))
                .toList();
    }

    private ArticleResponse toResponse(WellnessArticle a) {
        return new ArticleResponse(a.getId(), a.getTitle(), a.getSummary(), a.getBody(), a.getCategory(),
                a.getReadMinutes(), a.getImageEmoji(), a.getPublishedAt());
    }

    private EventResponse toResponse(WellnessEvent event, List<EventRsvp> rsvps, Long userId) {
        boolean rsvped = rsvps.stream().anyMatch(r -> r.getUserId().equals(userId));
        return new EventResponse(event.getId(), event.getTitle(), event.getDescription(), event.getStartsAt(),
                event.getLocation(), event.getCapacity(), rsvps.size(), rsvped);
    }
}
