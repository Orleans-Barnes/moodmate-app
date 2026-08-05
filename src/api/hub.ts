import { apiGet, apiPost } from './client';
import type { ArticleView, EventView, PageResponse } from './types';

export function listArticles(
  token: string,
  category?: string,
  page = 0,
  size = 20
): Promise<PageResponse<ArticleView>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (category) params.set('category', category);
  return apiGet<PageResponse<ArticleView>>(`/api/hub/articles?${params.toString()}`, token);
}

export function listEvents(
  token: string,
  page = 0,
  size = 20
): Promise<PageResponse<EventView>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiGet<PageResponse<EventView>>(`/api/hub/events?${params.toString()}`, token);
}

export function rsvpToEvent(token: string, id: number): Promise<EventView> {
  return apiPost<EventView>(`/api/hub/events/${id}/rsvp`, undefined, token);
}

export function cancelRsvp(token: string, id: number): Promise<EventView> {
  return apiPost<EventView>(`/api/hub/events/${id}/rsvp/cancel`, undefined, token);
}
