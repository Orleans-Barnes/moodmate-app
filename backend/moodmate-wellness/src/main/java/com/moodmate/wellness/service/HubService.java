package com.moodmate.wellness.service;

import com.moodmate.wellness.dto.ArticleResponse;
import com.moodmate.wellness.dto.CreateArticleRequest;
import com.moodmate.wellness.dto.CreateEventRequest;
import com.moodmate.wellness.dto.EventResponse;
import com.moodmate.wellness.dto.UpdateArticleRequest;
import com.moodmate.wellness.dto.UpdateEventRequest;
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

    // ── Phase 1H (Admin Portal - Wellness Content) - admin-only writes on top of the previously
    // read-only HubController. ──────────────────────────────────────────────────────────────────

    @Transactional
    public ArticleResponse createArticle(CreateArticleRequest request) {
        WellnessArticle article = WellnessArticle.builder()
                .title(request.title())
                .summary(request.summary())
                .body(request.body())
                .category(request.category())
                .readMinutes(request.readMinutes())
                .imageEmoji(request.imageEmoji())
                .publishedAt(Instant.now())
                .build();
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public ArticleResponse updateArticle(Long articleId, UpdateArticleRequest request) {
        WellnessArticle article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ApiException("Article not found: " + articleId, HttpStatus.NOT_FOUND));
        if (request.title() != null) article.setTitle(request.title());
        if (request.summary() != null) article.setSummary(request.summary());
        if (request.body() != null) article.setBody(request.body());
        if (request.category() != null) article.setCategory(request.category());
        if (request.readMinutes() != null) article.setReadMinutes(request.readMinutes());
        if (request.imageEmoji() != null) article.setImageEmoji(request.imageEmoji());
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public void deleteArticle(Long articleId) {
        if (!articleRepository.existsById(articleId)) {
            throw new ApiException("Article not found: " + articleId, HttpStatus.NOT_FOUND);
        }
        articleRepository.deleteById(articleId);
    }

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        WellnessEvent event = WellnessEvent.builder()
                .title(request.title())
                .description(request.description())
                .startsAt(request.startsAt())
                .location(request.location())
                .capacity(request.capacity())
                .createdAt(Instant.now())
                .build();
        event = eventRepository.save(event);
        return toResponse(event, List.of(), null);
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request) {
        WellnessEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException("Event not found: " + eventId, HttpStatus.NOT_FOUND));
        if (request.title() != null) event.setTitle(request.title());
        if (request.description() != null) event.setDescription(request.description());
        if (request.startsAt() != null) event.setStartsAt(request.startsAt());
        if (request.location() != null) event.setLocation(request.location());
        if (request.capacity() != null) event.setCapacity(request.capacity());
        event = eventRepository.save(event);
        return toResponse(event, eventRsvpRepository.findByEventIdIn(List.of(eventId)), null);
    }

    // event_rsvps.event_id has ON DELETE CASCADE (see V1__init_schema.sql) - no app-level cleanup
    // of RSVP rows needed here, the DB handles it.
    @Transactional
    public void deleteEvent(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ApiException("Event not found: " + eventId, HttpStatus.NOT_FOUND);
        }
        eventRepository.deleteById(eventId);
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
