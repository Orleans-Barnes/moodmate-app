import { apiGet, apiPost } from './client';
import type { CheckInRequest, CheckInResponse, PageResponse } from './types';

export function recordCheckIn(token: string, request: CheckInRequest): Promise<CheckInResponse> {
  return apiPost<CheckInResponse>('/api/checkins', request, token);
}

export function listCheckIns(token: string, page = 0, size = 20): Promise<PageResponse<CheckInResponse>> {
  return apiGet<PageResponse<CheckInResponse>>(`/api/checkins?page=${page}&size=${size}`, token);
}
