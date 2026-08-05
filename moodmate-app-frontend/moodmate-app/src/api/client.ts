import { BACKEND_BASE_URL } from '@/config';
import type { AuthResponse } from './types';
import { getStoredRefreshToken, logoutExpiredSession, storeRefreshedTokens } from './authSession';

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Catch blocks across the app were written as `err instanceof ApiRequestError ? err.message :
// 'some generic fallback'` - that's correct for a failed HTTP call, but silently swallows any
// OTHER thrown value (a plain TypeError/SyntaxError from a bug elsewhere in the try block, not
// the network request itself) into a mystery fallback string that gives no way to diagnose what
// actually broke. This always logs the raw error for devtools/Metro console visibility, and
// surfaces any Error's own .message (not just ApiRequestError's) instead of guessing - falling
// back to the caller's generic string only for a genuinely non-Error throw (e.g. a string literal).
export function getErrorMessage(err: unknown, fallback: string): string {
  console.error(err);
  if (err instanceof Error) return err.message;
  return fallback;
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
  const currentRefreshToken = getStoredRefreshToken();
  if (!currentRefreshToken) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AuthResponse;
    await storeRefreshedTokens(data.token, data.refreshToken);
    return data.token;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// No request had ever bounded how long fetch() is allowed to hang. If the backend's IP in
// config.ts is stale (the most common cause - the dev machine's LAN IP changes between Wi-Fi
// sessions) or the backend just isn't running, fetch() to an unreachable address doesn't reject
// quickly - it can hang effectively forever with no error ever surfacing, which looks exactly
// like "the spinner never stops" from the UI's point of view (the request promise never settles,
// so the caller's own `finally { setLoading(false) }` never runs either). This timeout guarantees
// every request eventually rejects with a clear, actionable error instead.
const REQUEST_TIMEOUT_MS = 15000;

async function request<T>(path: string, options: RequestInit = {}, _isRetry = false): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiRequestError(
        `Could not reach the server at ${BACKEND_BASE_URL} — check that the gateway is running on port 8080 and that your phone is on the same network as this PC.`,
        0,
      );
    }
    throw new ApiRequestError(
      `Could not reach the server at ${BACKEND_BASE_URL}. Check your connection and try again.`,
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Attempt a silent refresh-and-retry exactly once for stale auth state:
  //  - 401 means the access token itself is invalid/expired
  //  - 403 can also mean the token is still valid but its role claims are stale
  //    (e.g. a counsellor/mentor approval happened while the user was already logged in).
  // Never refresh from the refresh/logout endpoints themselves.
  const hadAuthHeader = !!(options.headers as Record<string, string> | undefined)?.Authorization;
  if ((response.status === 401 || response.status === 403) && hadAuthHeader && !_isRetry && !NO_REFRESH_PATHS.includes(path)) {
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
    if (response.status === 401) {
      // Refresh failed (token expired/revoked/reused) - the session is no longer recoverable.
      await logoutExpiredSession();
    }
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

// Added for Phase 1E Step 3 (notification center) - PATCH /api/notifications/{id}/read and
// /read-all needed a verb this client didn't already have (only GET/POST/PUT/DELETE existed).
export function apiPatch<T>(path: string, body?: unknown, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: authHeader(token),
  });
}

function authHeader(token?: string): Record<string, string> {
  // 'guest' is a synthetic local-only token — never send it to the real API
  return token && token !== 'guest' ? { Authorization: `Bearer ${token}` } : {};
}

// Generic defaults to void so every existing 204-No-Content caller is unaffected; DELETE
// endpoints that return a body (like DELETE /api/users/me/avatar's updated UserDto) can call
// apiDelete<T>(...) explicitly instead.
export function apiDelete<T = void>(path: string, token?: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'DELETE', body: body !== undefined ? JSON.stringify(body) : undefined, headers: authHeader(token) });
}

export async function refreshAuthToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
