import { apiGet, apiPost, apiPut } from './client';
import { ApiRequestError } from './client';
import { BACKEND_BASE_URL } from '@/config';
import type { AuthResponse, UserProfile } from './types';

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
  institution?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName: string;
  institution?: string;
  avatarEmoji?: string;
}

export interface AdminSetupInput {
  fullName: string;
  email: string;
  password: string;
}

export function signup(input: SignupInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/signup', input);
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/login', input);
}

export function guestLogin(): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/guest');
}

export function getMyProfile(token: string): Promise<UserProfile> {
  return apiGet<UserProfile>('/api/users/me', token);
}

export function updateMyProfile(token: string, input: UpdateProfileInput): Promise<UserProfile> {
  return apiPut<UserProfile>('/api/users/me', input, token);
}

export function adminSetup(input: AdminSetupInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/admin-setup', input);
}

export async function uploadAvatar(token: string, imageUri: string): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  } as unknown as Blob);

  const response = await fetch(`${BACKEND_BASE_URL}/api/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const text = await response.text();
  if (!response.ok) {
    let msg = `Upload failed (${response.status})`;
    try { msg = JSON.parse(text)?.message ?? msg; } catch { /* ignore */ }
    throw new ApiRequestError(msg, response.status);
  }
  return JSON.parse(text) as UserProfile;
}

// Alias kept for backward compat
export { guestLogin as loginAsGuest };

export function forgotPassword(email: string): Promise<void> {
  return apiPost<void>('/api/auth/forgot-password', { email });
}

export function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  return apiPost<void>('/api/auth/reset-password', { email, otp, newPassword });
}
