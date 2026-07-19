import { apiGet, apiPut, apiPost, ApiRequestError } from './client';
import type {
  StudentProfileRequest,
  StudentProfileResponse,
  WellnessPreferenceRequest,
  WellnessPreferenceResponse,
  ProfileStatusResponse,
} from './types';

// Phase 1C-iii — thin wrappers over moodmate-auth's profile endpoints (Phase 1C-i/1C-i.5/1C-i.6).
// Every function here mirrors PHASE_1C_I_API_CONTRACT.md exactly: partial-update PUT semantics
// (a field omitted/undefined leaves it untouched server-side — never send a key you don't intend
// to change), 404 on GET before anything's been saved, 409 on an optimistic-lock conflict.

export function getProfileStatus(token: string): Promise<ProfileStatusResponse> {
  return apiGet<ProfileStatusResponse>('/api/users/me/profile-status', token);
}

export async function getStudentProfile(token: string): Promise<StudentProfileResponse | null> {
  try {
    return await apiGet<StudentProfileResponse>('/api/users/me/student-profile', token);
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return null;
    throw e;
  }
}

export function putStudentProfile(token: string, body: StudentProfileRequest): Promise<StudentProfileResponse> {
  return apiPut<StudentProfileResponse>('/api/users/me/student-profile', body, token);
}

export async function getWellnessPreferences(token: string): Promise<WellnessPreferenceResponse | null> {
  try {
    return await apiGet<WellnessPreferenceResponse>('/api/users/me/wellness-preferences', token);
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return null;
    throw e;
  }
}

export function putWellnessPreferences(token: string, body: WellnessPreferenceRequest): Promise<WellnessPreferenceResponse> {
  return apiPut<WellnessPreferenceResponse>('/api/users/me/wellness-preferences', body, token);
}

export function completeWellnessOnboarding(token: string): Promise<WellnessPreferenceResponse> {
  return apiPost<WellnessPreferenceResponse>('/api/users/me/wellness-preferences/complete', undefined, token);
}

export function skipWellnessOnboarding(token: string): Promise<WellnessPreferenceResponse> {
  return apiPost<WellnessPreferenceResponse>('/api/users/me/wellness-preferences/skip', undefined, token);
}

// Call only at the moment the onboarding prompt is actually rendered on screen — not on every
// profile-status poll — so the 7-day cooldown (computed server-side from
// max(skippedAt, lastPromptedAt)) stays honest. Returns void: the endpoint is 204 No Content.
export function markOnboardingPrompted(token: string): Promise<void> {
  return apiPost<void>('/api/users/me/wellness-preferences/prompted', undefined, token);
}
