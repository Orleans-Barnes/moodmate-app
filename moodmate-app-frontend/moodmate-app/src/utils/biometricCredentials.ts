import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '@/api/types';
import type { UserRole } from '@/navigation/types';

const ACCOUNT_INDEX_KEY = 'moodmate_biometric_accounts_v1';
const LAST_ACCOUNT_KEY = 'moodmate_biometric_last_account_v1';
const TOKEN_PREFIX = 'moodmate_biometric_refresh_v1';

export interface BiometricAccount {
  email: string;
  role: UserRole;
  userId: number;
  fullName: string;
  enrolledAt: string;
}

export function biometricRuntimeSupported() {
  return Constants.appOwnership !== 'expo' && Platform.OS !== 'web';
}

export function normalizeBiometricEmail(email: string) {
  return email.trim().toLowerCase();
}

function accountKey(role: UserRole, email: string) {
  const safeEmail = normalizeBiometricEmail(email).replace(/[^a-z0-9._-]/g, '_');
  return `${TOKEN_PREFIX}_${role}_${safeEmail}`;
}

async function loadAccounts(): Promise<BiometricAccount[]> {
  try {
    const raw = await SecureStore.getItemAsync(ACCOUNT_INDEX_KEY);
    return raw ? JSON.parse(raw) as BiometricAccount[] : [];
  } catch {
    return [];
  }
}

async function saveAccounts(accounts: BiometricAccount[]) {
  await SecureStore.setItemAsync(ACCOUNT_INDEX_KEY, JSON.stringify(accounts));
}

export async function biometricHardwareReady() {
  if (!biometricRuntimeSupported()) return false;
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    const [secureStoreAvailable, hasHardware, enrolled] = await Promise.all([
      SecureStore.isAvailableAsync(),
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return secureStoreAvailable && hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function findBiometricAccount(role: UserRole, email?: string): Promise<BiometricAccount | null> {
  const accounts = await loadAccounts();
  const normalized = email ? normalizeBiometricEmail(email) : '';
  if (normalized) {
    return accounts.find((account) => account.role === role && account.email === normalized) ?? null;
  }

  const lastRaw = await SecureStore.getItemAsync(LAST_ACCOUNT_KEY);
  if (lastRaw) {
    try {
      const last = JSON.parse(lastRaw) as Pick<BiometricAccount, 'email' | 'role'>;
      if (last.role === role) {
        return accounts.find((account) => account.role === role && account.email === last.email) ?? null;
      }
    } catch {
      // Fall back to the latest enrolled account for the selected role.
    }
  }

  return accounts.filter((account) => account.role === role).sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt))[0] ?? null;
}

export async function saveBiometricRefreshToken(user: UserProfile, refreshToken: string) {
  const role = user.role as UserRole;
  const email = normalizeBiometricEmail(user.email);
  const account: BiometricAccount = {
    email,
    role,
    userId: user.id,
    fullName: user.fullName,
    enrolledAt: new Date().toISOString(),
  };

  await SecureStore.setItemAsync(accountKey(role, email), refreshToken, {
    requireAuthentication: true,
    authenticationPrompt: 'Confirm fingerprint for MoodMate',
  });

  const accounts = await loadAccounts();
  const nextAccounts = [
    account,
    ...accounts.filter((item) => !(item.role === role && item.email === email)),
  ];
  await Promise.all([
    saveAccounts(nextAccounts),
    SecureStore.setItemAsync(LAST_ACCOUNT_KEY, JSON.stringify({ email, role })),
  ]);
}

export async function readBiometricRefreshToken(account: BiometricAccount) {
  return SecureStore.getItemAsync(accountKey(account.role, account.email), {
    requireAuthentication: true,
    authenticationPrompt: 'Unlock MoodMate with fingerprint',
  });
}

export async function removeBiometricAccount(account: BiometricAccount) {
  const accounts = await loadAccounts();
  await Promise.all([
    SecureStore.deleteItemAsync(accountKey(account.role, account.email)),
    saveAccounts(accounts.filter((item) => !(item.role === account.role && item.email === account.email))),
  ]);
}
