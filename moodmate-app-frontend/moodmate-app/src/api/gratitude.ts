import { apiGet, apiPost, apiDelete } from './client';
import type { GratitudeEntryCreateRequest, GratitudeEntryView, PageResponse } from './types';

export function listGratitudeEntries(token: string, page = 0, size = 20): Promise<PageResponse<GratitudeEntryView>> {
  return apiGet<PageResponse<GratitudeEntryView>>(`/api/gratitude?page=${page}&size=${size}`, token);
}

export function createGratitudeEntry(token: string, request: GratitudeEntryCreateRequest): Promise<GratitudeEntryView> {
  return apiPost<GratitudeEntryView>('/api/gratitude', request, token);
}

export function deleteGratitudeEntry(token: string, id: number): Promise<void> {
  return apiDelete(`/api/gratitude/${id}`, token);
}
