package com.moodmate.community.dto;

import com.moodmate.community.entity.ContentType;
import com.moodmate.community.entity.ReportStatus;

import java.time.Instant;

/** contentPreview/contentAuthorId are resolved at read time from the underlying post/comment (not
 * stored on the report itself) so the queue always reflects the content's current text - a report
 * filed against content that was since edited (Feature 6) shows the latest wording, not a stale
 * snapshot. Both are null if the underlying content was already deleted by the time this is read
 * (e.g. removed via the ordinary delete endpoint rather than through this moderation flow). */
public record ReportResponse(Long id, ContentType contentType, Long contentId, Long postId,
                              String contentPreview, Long contentAuthorId, Long reporterId,
                              String reason, ReportStatus status, Instant createdAt) {
}
