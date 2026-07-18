import { BACKEND_BASE_URL } from '@/config';
import { useAuthStore } from '@/state/useAuthStore';
import type { AuthResponse } from './types';

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiErrorBody {
  message?: string;
  fieldErrors?: Record<string, string>;
}

// Phase 1A - JWT Refresh Tokens (frontend half). The backend has had a working
// POST /api/auth/refresh (rotates refresh token, returns a new access+refresh pair) since
// Feature 4, but nothing in the app ever called it - access tokens are valid 24h
// (JWT_EXPIRATION_MINUTES), so every session silently died after 24h with no recovery. This adds
// a 401-triggered refresh-and-retry, module-scoped so concurrent 401s from multiple in-flight
// requests share a single refresh call instead of racing each other.
let refreshPromise: Promise<string | null> | null = null;

// Endpoints that must never trigger a refresh attempt themselves - refreshing on a 401 from the
// refresh endpoint itself would recurse; unauthenticated auth endpoints never carry a token in
// the first place so they're excluded implicitly by the "had an Authorization header" check
// below, but the refresh/logout paths are excluded explicitly for clarity and defense in depth.
const NO_REFRESH_PATHS = ['/api/auth/refresh', '/api/auth/logout'];

async function performRefresh(): Promise<string | null> {
  const currentRefreshToken = useAuthStore.getState().refreshToken;
  if (!currentRefreshToken) return null;
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AuthResponse;
    await useAuthStore.getState().setTokens(data.token, data.refreshToken);
    return data.token;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}, _isRetry = false): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.', 0);
  }

  // Attempt a silent refresh-and-retry exactly once: only for a 401 on a request that actually
  // carried an access token (unauthenticated calls like login/signup 401-ing means "wrong
  // password", not "expired token" — refreshing there would be pointless and confusing), and
  // never for the refresh/logout endpoints themselves.
  const hadAuthHeader = !!(options.headers as Record<string, string> | undefined)?.Authorization;
  if (response.status === 401 && hadAuthHeader && !_isRetry && !NO_REFRESH_PATHS.includes(path)) {
    if (!refreshPromise) {
      refreshPromise = performRefresh().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(
        path,
        { ...options, headers: { ...(options.headers as Record<string, string>), Authorization: `Bearer ${newToken}` } },
        true,
      );
    }
    // Refresh failed (token expired/revoked/reused) - the session is no longer recoverable.
    // Best-effort local logout so the app naturally routes back to a login screen instead of
    // looping on 401s forever.
    await useAuthStore.getState().logout();
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as (ApiErrorBody & Record<string, unknown>) | null) : null;

  if (!response.ok) {
    const message = extractErrorMessage(data) ?? `Something went wrong (${response.status})`;
    throw new ApiRequestError(message, response.status);
  }

  return data as T;
}

// The backend returns two error shapes (see GlobalExceptionHandler): a plain {message: ...}
// for most failures, and {fieldErrors: {...}} specifically for @Valid validation failures.
function extractErrorMessage(data: ApiErrorBody | null): string | undefined {
  if (!data) return undefined;
  if (typeof data.message === 'string') return data.message;
  if (data.fieldErrors) {
    const first = Object.values(data.fieldErrors)[0];
    if (typeof first === 'string') return first;
  }
  return undefined;
}

export function apiGet<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, { method: 'GET', headers: authHeader(token) });
}

export function apiPost<T>(path: string, body?: unknown, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: authHeader(token),
  });
}

export function apiPut<T>(path: string, body?: unknown, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: authHeader(token),
  });
}

function authHeader(token?: string): Record<string, string> {
  // 'guest' is a synthetic local-only token — never send it to the real API
  return token && token !== 'guest' ? { Authorization: `Bearer ${token}` } : {};
}

export function apiDelete(path: string, token?: string, body?: unknown): Promise<void> {
  return request<void>(path, { method: 'DELETE', body: body !== undefined ? JSON.stringify(body) : undefined, headers: authHeader(token) });
}
