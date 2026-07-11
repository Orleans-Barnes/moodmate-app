package com.moodmate.backend.community;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    Page<CommunityPost> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<CommunityPost> findByTopicOrderByCreatedAtDesc(String topic, Pageable pageable);
}
