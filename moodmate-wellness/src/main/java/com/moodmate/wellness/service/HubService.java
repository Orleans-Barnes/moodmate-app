package com.moodmate.wellness.service;

import com.moodmate.wellness.dto.ArticleResponse;
import com.moodmate.wellness.dto.EventResponse;
import com.moodmate.wellness.entity.EventRsvp;
import com.moodmate.wellness.entity.WellnessArticle;
import com.moodmate.wellness.entity.WellnessEvent;
import com.moodmate.wellness.exception.ApiException;
import com.moodmate.wellness.repository.EventRsvpRepository;
import com.moodmate.wellness.repository.WellnessArticleRepository;
import com.moodmate.wellness.repository.WellnessEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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
                .orElseThrow(() -> new ApiException("Article not found: " + articleId, HttpStatus.NOT_FOUND));
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

    /**
     * Fix #5 from review: uses findByIdForUpdate (a pessimistic row lock, see
     * WellnessEventRepository) instead of a plain findById. Previously the capacity check
     * (countByEventId) and the RSVP insert ran with no locking, so two concurrent requests near
     * capacity could both read a count under the limit and both insert, overbooking the event.
     * Locking the event row for the rest of this transaction serializes RSVPs on the same event,
     * so the count-then-insert sequence can no longer race. The DB's own UNIQUE(event_id,user_id)
     * constraint still separately prevents one user double-booking themselves.
     */
    @Transactional
    public EventResponse rsvp(Long userId, Long eventId) {
        WellnessEvent event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ApiException("Event not found: " + eventId, HttpStatus.NOT_FOUND));

        boolean alreadyRsvped = eventRsvpRepository.findByEventIdAndUserId(eventId, userId).isPresent();
        if (!alreadyRsvped) {
            long currentCount = eventRsvpRepository.countByEventId(eventId);
            if (event.getCapacity() != null && currentCount >= event.getCapacity()) {
                throw new ApiException("This event is full", HttpStatus.CONFLICT);
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
                .orElseThrow(() -> new ApiException("Event not found: " + eventId, HttpStatus.NOT_FOUND));

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
