import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
// Direct build imports — expo-notifications barrel re-exports don't resolve under
// moduleResolution:bundler in TS 5.7; importing from the specific file works correctly.
import { addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import type { NotificationResponse } from 'expo-notifications/build/Notifications.types';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastHost } from '@/components/ToastHost';
import { colors, darkPalette } from '@/theme/tokens';
import { resetInactivityReminder, getExpoPushToken } from '@/utils/notifications';
import { registerPushToken, removePushToken } from '@/api/push';
import { useAuthStore } from '@/state/useAuthStore';
import { useFeatureFlagStore } from '@/state/useFeatureFlagStore';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';
import type { RootStackParamList } from '@/navigation/types';

const NAV_LIGHT_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    primary: colors.coral,
  },
};

const NAV_DARK_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: darkPalette.bg,
    card: darkPalette.surface,
    text: darkPalette.text,
    border: darkPalette.border,
    primary: darkPalette.primary,
  },
};

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const pushTokenRef   = useRef<string | null>(null);
  const { token: authToken } = useAuthStore();
  const { isDark } = useResolvedAppearance();

  // ── Inactivity reminder: reset every time app comes to foreground ──────────
  useEffect(() => {
    resetInactivityReminder().catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') resetInactivityReminder().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  // ── Feature flags: fetch once per login, read from anywhere via useFeatureFlagStore ─────────
  useEffect(() => {
    if (authToken && authToken !== 'guest') {
      useFeatureFlagStore.getState().load(authToken).catch(() => {});
    }
  }, [authToken]);

  // ── Push token: register on login, remove on logout ────────────────────────
  useEffect(() => {
    if (!authToken || authToken === 'guest') {
      if (pushTokenRef.current) {
        removePushToken(pushTokenRef.current, '').catch(() => {});
        pushTokenRef.current = null;
      }
      return;
    }
    getExpoPushToken().then((token) => {
      if (!token) return;
      pushTokenRef.current = token;
      registerPushToken(token, authToken).catch(() => {});
    });
  }, [authToken]);

  // ── Notification tap: navigate to the right screen ─────────────────────────
  useEffect(() => {
    const sub = addNotificationResponseReceivedListener((response: NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { screen?: string; params?: string }
        | undefined;
      const screen = data?.screen;
      if (!screen) return;

      // Milestone 9 (Notifications) - push payload destinationParams. Previously only the
      // destination screen made it through; this mirrors NotificationCenterScreen.handleTap's
      // JSON.parse(item.destinationParams) so a push tap can land on the specific record it was
      // about (e.g. a specific appointment), not just the general screen.
      let params: Record<string, unknown> | undefined;
      if (data?.params) {
        try { params = JSON.parse(data.params); } catch { params = undefined; }
      }

      // Screens that live inside MainTabParamList (nested under the root's 'Main' screen), not
      // directly on RootStackParamList - same distinction NotificationCenterScreen's handleTap
      // makes for in-app taps (see that file's doc comment for the exact symptom this avoids:
      // navigating to a nested-tab screen name directly from the root fails silently, the same
      // way SOSScreen's old "Talk to a counsellor" link once did).
      const NESTED_TAB_SCREENS = new Set(['Home', 'Journal', 'Explore', 'Community', 'Insights', 'Support']);
      const ROOT_ALIASES: Partial<Record<string, keyof RootStackParamList>> = {
        AiChat:       'AiChat',
        CheckIn:      'CheckIn',
        Habits:       'HabitTracker',
        HabitTracker: 'HabitTracker',
        Sleep:        'SleepTracker',
        SleepTracker: 'SleepTracker',
      };

      const tryNavigate = () => {
        if (navigationRef.current?.isReady()) {
          if (NESTED_TAB_SCREENS.has(screen)) {
            navigationRef.current.navigate('Main' as any, { screen, params } as any);
          } else {
            const route = ROOT_ALIASES[screen] ?? 'Main';
            navigationRef.current.navigate(route as any, params as any);
          }
        } else {
          setTimeout(tryNavigate, 300);
        }
      };
      tryNavigate();
    });
    return () => sub.remove();
  }, []);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular':   PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium':    PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold':  PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold':      PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? darkPalette.bg : colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={isDark ? darkPalette.primary : colors.coral} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={isDark ? NAV_DARK_THEME : NAV_LIGHT_THEME}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
        <ToastHost />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
