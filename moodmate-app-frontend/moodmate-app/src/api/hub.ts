import { apiDelete, apiGet, apiPatch, apiPost } from './client';
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

// ── Phase 1H (Admin Portal - Wellness Content) ────────────────────────────
// Mirrors the new admin-gated routes on com.moodmate.wellness.controller.HubController.
// publishedAt/rsvp fields aren't inputs here - the backend sets publishedAt server-side at
// creation (publish-now semantics) and rsvp/goingCount are read-only, driven by real RSVPs.

export interface CreateArticleInput {
  title: string;
  summary?: string;
  body: string;
  category: string;
  readMinutes: number;
  imageEmoji: string;
}

export interface UpdateArticleInput {
  title?: string;
  summary?: string;
  body?: string;
  category?: string;
  readMinutes?: number;
  imageEmoji?: string;
}

export function createArticle(token: string, input: CreateArticleInput): Promise<ArticleView> {
  return apiPost<ArticleView>('/api/hub/articles', input, token);
}

export function updateArticle(token: string, id: number, input: UpdateArticleInput): Promise<ArticleView> {
  return apiPatch<ArticleView>(`/api/hub/articles/${id}`, input, token);
}

export function deleteArticle(token: string, id: number): Promise<void> {
  return apiDelete(`/api/hub/articles/${id}`, token);
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startsAt: string;
  location?: string;
  capacity?: number;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startsAt?: string;
  location?: string;
  capacity?: number;
}

export function createEvent(token: string, input: CreateEventInput): Promise<EventView> {
  return apiPost<EventView>('/api/hub/events', input, token);
}

export function updateEvent(token: string, id: number, input: UpdateEventInput): Promise<EventView> {
  return apiPatch<EventView>(`/api/hub/events/${id}`, input, token);
}

export function deleteEvent(token: string, id: number): Promise<void> {
  return apiDelete(`/api/hub/events/${id}`, token);
}

// Admin listing reuses the same public GET endpoints (listArticles/listEvents above) - no
// separate admin-only read endpoint was needed since articles/events have no draft/unpublished
// state to hide from students, unlike counsellors (PENDING) or users (banned).
