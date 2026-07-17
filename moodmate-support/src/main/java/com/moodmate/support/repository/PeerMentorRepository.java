package com.moodmate.support.repository;

import com.moodmate.support.entity.PeerMentor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PeerMentorRepository extends JpaRepository<PeerMentor, Long> {
    List<PeerMentor> findByAvailableTrueOrderBySortOrder();
}
