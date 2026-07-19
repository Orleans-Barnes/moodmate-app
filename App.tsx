import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Baloo2_700Bold, Baloo2_600SemiBold } from '@expo-google-fonts/baloo-2';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
// Direct build imports — expo-notifications barrel re-exports don't resolve under
// moduleResolution:bundler in TS 5.7; importing from the specific file works correctly.
import { addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import type { NotificationResponse } from 'expo-notifications/build/Notifications.types';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastHost } from '@/components/ToastHost';
import { colors } from '@/theme/tokens';
import { resetInactivityReminder, getExpoPushToken } from '@/utils/notifications';
import { registerPushToken, removePushToken } from '@/api/push';
import { useAuthStore } from '@/state/useAuthStore';
import type { RootStackParamList } from '@/navigation/types';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const pushTokenRef   = useRef<string | null>(null);
  const { token: authToken } = useAuthStore();

  // ── Inactivity reminder: reset every time app comes to foreground ──────────
  useEffect(() => {
    resetInactivityReminder().catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') resetInactivityReminder().catch(() => {});
    });
    return () => sub.remove();
  }, []);

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
        | { screen?: string }
        | undefined;
      const screen = data?.screen;
      if (!screen) return;

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
            navigationRef.current.navigate('Main' as any, { screen } as any);
          } else {
            const route = ROOT_ALIASES[screen] ?? 'Main';
            navigationRef.current.navigate(route as any);
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
    'Baloo2-Bold':     Baloo2_700Bold,
    'Baloo2-SemiBold': Baloo2_600SemiBold,
    'DMSans-Regular':  DMSans_400Regular,
    'DMSans-Medium':   DMSans_500Medium,
    'DMSans-Bold':     DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.coral} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <RootNavigator />
        <ToastHost />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
