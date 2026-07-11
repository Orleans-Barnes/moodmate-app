import { apiDelete, apiGet, apiPost } from './client';
import type {
  CommunityPostCreateRequest,
  CommunityPostView,
  PageResponse,
  ReactionType,
  ReactResponseView,
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
