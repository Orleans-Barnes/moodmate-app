import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { MainTabs } from './MainTabs';
import { CounsellorTabs } from './CounsellorTabs';
import { MentorTabs } from './MentorTabs';
import { useAuthStore } from '@/state/useAuthStore';
import { useGamificationStore } from '@/state/useGamificationStore';
import { useGuestStore } from '@/state/useGuestStore';
import { SaveProgressModal } from '@/components/SaveProgressModal';
import { useNavigation } from '@react-navigation/native';
import { getMyProfile } from '@/api/auth';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

/**
 * Routes to the correct tab set by role, triggers the MoodGate check-in flow
 * once per day for real users, and hosts the guest SaveProgressModal overlay.
 */
export function MainRouter() {
  const role  = useAuthStore((s) => s.user?.role);
  const guest = useAuthStore((s) => s.user?.guest ?? false);
  const token = useAuthStore((s) => s.token);
  const shouldShowMoodGate = useGamificationStore((s) => s.shouldShowMoodGate);
  const setSyncToken = useGamificationStore((s) => s.setSyncToken);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Keeps the gamification store's backend sync in step with whoever is currently logged in -
  // fires once on login (fetches earned achievements) and again on logout (clears the token so
  // no further background unlock calls go out under the wrong session). See Task #25.
  useEffect(() => {
    setSyncToken(token ?? null);
  }, [token, setSyncToken]);

  useEffect(() => {
    const refreshProfile = async () => {
      if (!token || token === 'guest') return;
      try {
        const freshUser = await getMyProfile(token);
        if (freshUser && freshUser.role !== role) {
          await useAuthStore.getState().setUser(freshUser);
        }
      } catch {
        // Ignore refresh failures here; user will be forced to re-authenticate on next guarded route.
      }
    };

    refreshProfile();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshProfile();
      }
    });
    return () => subscription.remove();
  }, [role, token]);

  useEffect(() => {
    // Admin users are routed to the dedicated admin stack screen
    if (role === 'ADMIN') {
      navigation.replace('AdminDashboard');
      return;
    }
    // Guests never see MoodGate — it requires a real account for the API call
    if (guest) return;
    if (role === 'STUDENT' && shouldShowMoodGate()) {
      const t = setTimeout(() => {
        navigation.navigate('MoodGate');
      }, 600);
      return () => clearTimeout(t);
    }
  }, [role, guest, shouldShowMoodGate, navigation]);

  const handleGuestCreateAccount = () => {
    navigation.navigate('Signup');
  };

  // Admin users navigate away immediately; render nothing while transition happens
  if (role === 'ADMIN') return null;

  return (
    <>
      {role === 'COUNSELLOR' ? <CounsellorTabs /> : role === 'MENTOR' ? <MentorTabs /> : <MainTabs />}
      {/* Guest SaveProgressModal — fires at most once per session */}
      <SaveProgressModal onCreateAccount={handleGuestCreateAccount} />
    </>
  );
}
