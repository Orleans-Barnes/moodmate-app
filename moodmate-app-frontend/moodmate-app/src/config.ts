/**
 * Central app configuration.
 *
 * BACKEND_BASE_URL is resolved in this order:
 *  1. EXPO_PUBLIC_BACKEND_BASE_URL (explicit override)
 *  2. The same LAN host Expo Go / Metro already used to reach this machine
 *     (from Constants hostUri / debuggerHost) — so a Wi‑Fi IP change no longer
 *     breaks sign-in as long as the QR/LAN connection still works
 *  3. FALLBACK_HOST below (last resort for web/tests when Expo hasn't injected a host)
 *
 * Manual override when needed:
 *   set EXPO_PUBLIC_BACKEND_BASE_URL=http://YOUR.IP:8080
 *   or edit FALLBACK_HOST after running: ipconfig
 */
import Constants from 'expo-constants';

const GATEWAY_PORT = 8080;

/** Last-resort host when Expo has not injected a packager host yet. */
const FALLBACK_HOST = '10.233.240.149';

function packagerHost(): string | null {
  const candidates: Array<string | null | undefined> = [
    Constants.expoConfig?.hostUri,
    // Legacy / Expo Go shapes still seen across SDK builds
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    // Examples: "10.96.157.149:8081", "exp://10.96.157.149:8081"
    const host = raw
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .trim();
    if (host) return host;
  }
  return null;
}

function resolveBackendBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const host = packagerHost() ?? FALLBACK_HOST;
  return `http://${host}:${GATEWAY_PORT}`;
}

export const BACKEND_BASE_URL = resolveBackendBaseUrl();
