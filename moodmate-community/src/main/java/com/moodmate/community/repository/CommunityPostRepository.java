package com.moodmate.community.repository;

import com.moodmate.community.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** findByFlaggedFalse.../findByFlaggedTrue variants are additive - they exclude flagged posts from
 * the public feed and back the admin moderation queue, both extensions of the monolith's plain
 * findAllByOrderByCreatedAtDesc/findByTopicOrderByCreatedAtDesc (kept below too, in case they're
 * needed without the flagged filter). */
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    Page<CommunityPost> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<CommunityPost> findByTopicOrderByCreatedAtDesc(String topic, Pageable pageable);

    Page<CommunityPost> findByFlaggedFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<CommunityPost> findByTopicAndFlaggedFalseOrderByCreatedAtDesc(String topic, Pageable pageable);

    List<CommunityPost> findByFlaggedTrue();
}
