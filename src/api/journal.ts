import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { JournalEntryCreateRequest, JournalEntryView, PageResponse } from './types';

export function listJournalEntries(token: string, page = 0, size = 20): Promise<PageResponse<JournalEntryView>> {
  return apiGet<PageResponse<JournalEntryView>>(`/api/journal?page=${page}&size=${size}`, token);
}

export function getJournalEntry(token: string, id: string): Promise<JournalEntryView> {
  return apiGet<JournalEntryView>(`/api/journal/${id}`, token);
}

export function createJournalEntry(token: string, request: JournalEntryCreateRequest): Promise<JournalEntryView> {
  return apiPost<JournalEntryView>('/api/journal', request, token);
}

export function updateJournalEntry(token: string, id: string, request: JournalEntryCreateRequest): Promise<JournalEntryView> {
  return apiPut<JournalEntryView>(`/api/journal/${id}`, request, token);
}

export function deleteJournalEntry(token: string, id: string): Promise<void> {
  return apiDelete(`/api/journal/${id}`, token);
}
