package com.moodmate.backend.hub;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRsvpRepository extends JpaRepository<EventRsvp, Long> {

    Optional<EventRsvp> findByEventIdAndUserId(Long eventId, Long userId);

    long countByEventId(Long eventId);

    List<EventRsvp> findByEventIdIn(List<Long> eventIds);

    List<EventRsvp> findByUserIdOrderByCreatedAtDesc(Long userId);
}
