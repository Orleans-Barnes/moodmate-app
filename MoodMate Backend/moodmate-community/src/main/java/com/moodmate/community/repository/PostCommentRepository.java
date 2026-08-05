package com.moodmate.community.repository;

import com.moodmate.community.entity.PostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/** New for Feature 6 (Community Comments). Top-level comments are paginated
 * (findByPostIdAndParentCommentIdIsNullOrderByCreatedAtAsc); all replies for a post are fetched
 * in one unpaginated query and nested onto their parent in-memory by CommunityService - avoids
 * recursive SQL for arbitrary-depth threads while still paginating at the top level, where a
 * post could realistically have hundreds of comments. */
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    Page<PostComment> findByPostIdAndParentCommentIdIsNullOrderByCreatedAtAsc(Long postId, Pageable pageable);

    List<PostComment> findByPostIdAndParentCommentIdIsNotNullOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);

    Optional<PostComment> findByIdAndPostId(Long id, Long postId);

    /** Batch version of countByPostId for feed rendering - one query for a whole page of posts
     * instead of N, mirroring how reactions are already batched via findByPostIdIn. */
    @Query("select c.postId as postId, count(c) as total from PostComment c where c.postId in :postIds group by c.postId")
    List<PostIdCount> countByPostIdIn(@Param("postIds") List<Long> postIds);

    interface PostIdCount {
        Long getPostId();
        long getTotal();
    }
}
