import { apiGet } from './client';
import type { SosResourceView } from './types';

/**
 * Deliberately called without a token - the backend's SosController whitelists
 * "/api/sos/**" as public/unauthenticated by product/ethics rule, and the frontend
 * must never make this depend on being logged in (or on Pro).
 */
export function listSosResources(country?: string): Promise<SosResourceView[]> {
  const query = country ? `?country=${encodeURIComponent(country)}` : '';
  return apiGet<SosResourceView[]>(`/api/sos/resources${query}`);
}
