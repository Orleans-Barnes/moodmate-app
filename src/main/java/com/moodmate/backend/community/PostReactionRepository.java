package com.moodmate.backend.community;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {
    List<PostReaction> findByPostId(Long postId);

    List<PostReaction> findByPostIdIn(List<Long> postIds);

    Optional<PostReaction> findByPostIdAndUserId(Long postId, Long userId);

    void deleteByPostId(Long postId);
}
