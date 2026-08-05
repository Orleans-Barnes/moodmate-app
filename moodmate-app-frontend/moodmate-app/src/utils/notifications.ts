import * as Notifications from 'expo-notifications';
import { default as getExpoPushTokenAsync } from 'expo-notifications/build/getExpoPushTokenAsync';
import { Platform } from 'react-native';

// The expo-notifications barrel doesn't re-export NotificationRequestInput,
// so we cast schedule calls to avoid TypeScript complaints about `identifier`.
type ScheduleRequest = Parameters<typeof Notifications.scheduleNotificationAsync>[0];

const INACTIVITY_ID     = 'moodmate-inactivity-reminder';
const DAILY_REMINDER_ID = 'moodmate-daily-reminder';
const INACTIVITY_DAYS   = 3;
const REMOTE_PUSH_ENABLED = process.env.EXPO_PUBLIC_ENABLE_REMOTE_PUSH === 'true';

const DAILY_QUOTES = [
  'Small steps still move you forward.',
  'You do not have to solve everything today.',
  'Pause, breathe, and meet this moment gently.',
  'Your wellbeing deserves a place on your calendar.',
  'Checking in is a quiet act of self-respect.',
  'You are allowed to begin again today.',
  'Progress can look like rest, honesty, or asking for help.',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

// ── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MoodMate',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6F4D',
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Alias used by ProfileScreen */
export const requestNotificationPermission = requestNotificationPermissions;

// ── Daily wellness reminder ───────────────────────────────────────────────────

export const REMINDER_TIMES: { label: string; hour: number; minute: number }[] = [
  { label: '8:00 AM',  hour:  8, minute: 0 },
  { label: '10:00 AM', hour: 10, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '3:00 PM',  hour: 15, minute: 0 },
  { label: '6:00 PM',  hour: 18, minute: 0 },
  { label: '9:00 PM',  hour: 21, minute: 0 },
];

export async function cancelDailyReminder(): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID); } catch { /* noop */ }
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await cancelDailyReminder();
  const quote = DAILY_QUOTES[Math.floor(Date.now() / 86_400_000) % DAILY_QUOTES.length];
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'A gentle check-in for today',
      body:  `${quote} How are you feeling?`,
      data:  { type: 'daily-reminder', screen: 'CheckIn' },
    },
    trigger: {
      type:   'daily' as const,
      hour,
      minute,
    },
  } as ScheduleRequest);
}

// ── Inactivity reminder ──────────────────────────────────────────────────────

export async function cancelInactivityReminder(): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(INACTIVITY_ID); } catch { /* noop */ }
}

export async function scheduleInactivityReminder(): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const fireAt = new Date();
  fireAt.setDate(fireAt.getDate() + INACTIVITY_DAYS);
  fireAt.setHours(10, 0, 0, 0);

  const messages = [
    { title: 'We miss you',       body: 'Your wellness tree needs some love. Check in today!' },
    { title: 'Still thinking of you', body: 'A 2-minute breathing session can change your whole day.' },
    { title: "It's been a while", body: 'Come back and keep your streak alive!' },
  ];
  const pick = messages[Math.floor(Math.random() * messages.length)];

  await Notifications.scheduleNotificationAsync({
    identifier: INACTIVITY_ID,
    content: { title: pick.title, body: pick.body, data: { type: 'inactivity' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  } as ScheduleRequest);
}

/** Call on every app open — resets the inactivity countdown. */
export async function resetInactivityReminder(): Promise<void> {
  await cancelInactivityReminder();
  await scheduleInactivityReminder();
}

// ── Expo Push Token ───────────────────────────────────────────────────────────

/**
 * Returns the device's Expo push token, or null if unavailable
 * (e.g. running in a simulator, permissions denied, no network, or Android
 * remote push has not been enabled for this dev build).
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'android' && !REMOTE_PUSH_ENABLED) {
      return null;
    }
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
    const tokenData = await getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}
