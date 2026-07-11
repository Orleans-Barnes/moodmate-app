declare module 'expo-notifications' {
  export enum AndroidImportance { DEFAULT = 3, HIGH = 4, MAX = 5 }
  export enum SchedulableTriggerInputTypes { CALENDAR = 'calendar', DATE = 'date', TIME_INTERVAL = 'timeInterval' }
  export interface NotificationChannel { name: string; importance: AndroidImportance; vibrationPattern?: number[]; lightColor?: string; }
  export function setNotificationChannelAsync(id: string, channel: NotificationChannel): Promise<void>;
  export function setNotificationHandler(handler: { handleNotification: (n: unknown) => Promise<{ shouldShowAlert: boolean; shouldPlaySound: boolean; shouldSetBadge: boolean }>; }): void;
  export function getPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
  export function requestPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
  export function scheduleNotificationAsync(req: { content: { title: string; body: string; data?: Record<string, unknown> }; trigger: Record<string, unknown> }): Promise<string>;
  export function getAllScheduledNotificationsAsync(): Promise<{ identifier: string; content: { title?: string; body?: string } }[]>;
  export function cancelScheduledNotificationAsync(id: string): Promise<void>;
}
