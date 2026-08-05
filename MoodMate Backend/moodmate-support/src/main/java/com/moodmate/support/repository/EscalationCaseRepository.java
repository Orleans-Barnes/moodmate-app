package com.moodmate.support.repository;

import com.moodmate.support.entity.EscalationCase;
import com.moodmate.support.entity.EscalationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EscalationCaseRepository extends JpaRepository<EscalationCase, Long> {
    List<EscalationCase> findByMentorUserIdOrderByCreatedAtDesc(Long mentorUserId);
    List<EscalationCase> findAllByOrderByCreatedAtDesc();
    List<EscalationCase> findByStatusOrderByCreatedAtDesc(EscalationStatus status);
}
