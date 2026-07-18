/**
 * Crisis alert API — used by counsellors and admins only.
 */
import { apiGet, apiPost } from './client';

export type CrisisSeverity = 'CRITICAL' | 'HIGH';
export type CrisisSource   = 'AI_CHAT' | 'JOURNAL';
export type CrisisStatus   = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type CrisisAction   = 'ACKNOWLEDGE' | 'RESOLVE';

export interface CrisisAlertDto {
  id: number;
  userId: number;
  triggerText: string;
  matchedKeywords: string;
  severity: CrisisSeverity;
  source: CrisisSource;
  status: CrisisStatus;
  handledByCounsellorId: number | null;
  resolutionNotes: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

/** Counsellor — list all OPEN alerts */
export function listOpenAlerts(token: string): Promise<CrisisAlertDto[]> {
  return apiGet('/api/crisis/alerts', token);
}

/** Counsellor — acknowledge or resolve an alert */
export function updateAlert(
  token: string,
  alertId: number,
  action: CrisisAction,
  notes?: string,
): Promise<CrisisAlertDto> {
  return apiPost(`/api/crisis/alerts/${alertId}`, { action, notes: notes ?? null }, token);
}

/** Admin/counsellor — get open alert count for badge */
export function getOpenAlertCount(token: string): Promise<{ open: number }> {
  return apiGet('/api/crisis/admin/count', token);
}

/** Admin — all alerts (any status) */
export function listAllAlerts(token: string): Promise<CrisisAlertDto[]> {
  return apiGet('/api/crisis/admin/alerts', token);
}
