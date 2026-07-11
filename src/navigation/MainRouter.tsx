import React, { useEffect } from 'react';
import { MainTabs } from './MainTabs';
import { CounsellorTabs } from './CounsellorTabs';
import { useAuthStore } from '@/state/useAuthStore';
import { useGamificationStore } from '@/state/useGamificationStore';
import { useGuestStore } from '@/state/useGuestStore';
import { SaveProgressModal } from '@/components/SaveProgressModal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

/**
 * Routes to the correct tab set by role, triggers the MoodGate check-in flow
 * once per day for real users, and hosts the guest SaveProgressModal overlay.
 */
export function MainRouter() {
  const role  = useAuthStore((s) => s.user?.role);
  const guest = useAuthStore((s) => s.user?.guest ?? false);
  const shouldShowMoodGate = useGamificationStore((s) => s.shouldShowMoodGate);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      {role === 'COUNSELLOR' ? <CounsellorTabs /> : <MainTabs />}
      {/* Guest SaveProgressModal — fires at most once per session */}
      <SaveProgressModal onCreateAccount={handleGuestCreateAccount} />
    </>
  );
}
