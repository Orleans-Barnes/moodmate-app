import { apiDelete, apiGet, apiPost } from './client';
import type {
  CommunityPostCreateRequest,
  CommunityPostView,
  PageResponse,
  ReactionType,
  ReactResponseView,
  ReportStatus,
  ReportView,
} from './types';

// Mirrors com.moodmate.backend.community.CommunityController (Phase 3, Task #7 - Community
// wired next per IMPLEMENTATION_PLAN.md).

export function listCommunityPosts(
  token: string,
  topic?: string,
  page = 0,
  size = 20
): Promise<PageResponse<CommunityPostView>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (topic) params.set('topic', topic);
  return apiGet<PageResponse<CommunityPostView>>(`/api/community/posts?${params.toString()}`, token);
}

export function createCommunityPost(
  token: string,
  request: CommunityPostCreateRequest
): Promise<CommunityPostView> {
  return apiPost<CommunityPostView>('/api/community/posts', request, token);
}

export function reactToPost(
  token: string,
  postId: number,
  type: ReactionType
): Promise<ReactResponseView> {
  return apiPost<ReactResponseView>(`/api/community/posts/${postId}/react`, { type }, token);
}

export function deleteCommunityPost(token: string, postId: number): Promise<void> {
  return apiDelete(`/api/community/posts/${postId}`, token);
}

// ── Phase 1H (Admin Portal - Community Moderation) ────────────────────────
// Mirrors com.moodmate.community.controller.ModerationController - fully built backend-side
// already (Feature 7), this file previously had no frontend wiring for any of it.

export function reportPost(token: string, postId: number, reason: string): Promise<ReportView> {
  return apiPost<ReportView>(`/api/community/posts/${postId}/report`, { reason }, token);
}

export function reportComment(token: string, commentId: number, reason: string): Promise<ReportView> {
  return apiPost<ReportView>(`/api/community/comments/${commentId}/report`, { reason }, token);
}

export function getModerationQueue(
  token: string,
  status: ReportStatus | 'ALL' = 'PENDING',
  page = 0,
  size = 20
): Promise<PageResponse<ReportView>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status !== 'ALL') params.set('status', status);
  return apiGet<PageResponse<ReportView>>(`/api/community/moderation/queue?${params.toString()}`, token);
}

export function approveReport(token: string, reportId: number): Promise<ReportView> {
  return apiPost<ReportView>(`/api/community/moderation/reports/${reportId}/approve`, undefined, token);
}

export function removeReportedContent(token: string, reportId: number): Promise<ReportView> {
  return apiPost<ReportView>(`/api/community/moderation/reports/${reportId}/remove`, undefined, token);
}

// Backend returns 204 No Content for ban/warn - no response body to type.
export function banReportedAuthor(token: string, reportId: number, reason?: string): Promise<void> {
  return apiPost<void>(`/api/community/moderation/reports/${reportId}/ban`, reason ? { reason } : undefined, token);
}

export function warnReportedAuthor(token: string, reportId: number, reason?: string): Promise<void> {
  return apiPost<void>(`/api/community/moderation/reports/${reportId}/warn`, reason ? { reason } : undefined, token);
}
