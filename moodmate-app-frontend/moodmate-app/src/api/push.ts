import { apiDelete, apiPut } from './client';

/**
 * Register a push token with the backend so the server can send notifications
 * to this device. Called once after login and silently re-called on foreground
 * to keep the token fresh (tokens can rotate).
 */
export function registerPushToken(pushToken: string, authToken: string): Promise<void> {
  return apiPut('/api/push/token', { token: pushToken }, authToken);
}

/**
 * Remove the push token on logout so the device stops receiving notifications
 * for the signed-out account.
 */
export function removePushToken(pushToken: string, authToken: string): Promise<void> {
  return apiDelete('/api/push/token', authToken, { token: pushToken });
}
