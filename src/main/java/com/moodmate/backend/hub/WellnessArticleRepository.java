package com.moodmate.backend.hub;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WellnessArticleRepository extends JpaRepository<WellnessArticle, Long> {

    Page<WellnessArticle> findAllByOrderByPublishedAtDesc(Pageable pageable);

    Page<WellnessArticle> findByCategoryOrderByPublishedAtDesc(String category, Pageable pageable);
}
