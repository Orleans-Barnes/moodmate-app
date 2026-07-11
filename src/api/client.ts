import { BACKEND_BASE_URL } from '@/config';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.', 0);
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
