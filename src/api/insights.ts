import { apiGet } from './client';

export interface InsightsResponse {
  narrativeSummary: string;    // AI-generated narrative
  sentimentScore: number;      // -100 to 100
  wellnessScore: number;       // 0 to 100
  forecastAlert: string | null;
  generatedAt: string;         // ISO datetime
}

export function fetchInsights(token: string): Promise<InsightsResponse> {
  return apiGet<InsightsResponse>('/api/insights', token);
}
