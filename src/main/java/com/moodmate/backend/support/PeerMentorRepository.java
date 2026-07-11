package com.moodmate.backend.support;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PeerMentorRepository extends JpaRepository<PeerMentor, Long> {
    List<PeerMentor> findByAvailableTrueOrderBySortOrder();
}
