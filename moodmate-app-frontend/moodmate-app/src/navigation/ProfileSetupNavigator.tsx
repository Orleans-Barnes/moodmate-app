import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileSetupStackParamList } from './types';
import { WelcomeScreen } from '@/screens/profileSetup/WelcomeScreen';
import { ProgrammeScreen } from '@/screens/profileSetup/ProgrammeScreen';
import { YearOfStudyScreen } from '@/screens/profileSetup/YearOfStudyScreen';
import { WellnessGoalsScreen } from '@/screens/profileSetup/WellnessGoalsScreen';
import { ChallengesScreen } from '@/screens/profileSetup/ChallengesScreen';
import { PreferredSupportScreen } from '@/screens/profileSetup/PreferredSupportScreen';
import { PreparingScreen } from '@/screens/profileSetup/PreparingScreen';

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

/**
 * Phase 1C-iii. Nested stack for the first-time student profile-completion journey — kept
 * separate from the existing 'Onboarding' route (the post-signup intro carousel), which is an
 * unrelated screen. Mounted at RootNavigator's 'ProfileSetup' entry.
 *
 * Screen order matches PHASE_1C_FIRST_TIME_STUDENT_JOURNEY_SEQUENCE.md exactly: each screen maps
 * 1:1 to a real backend field/endpoint, so there's nowhere a selection could go that the backend
 * doesn't have a place for.
 */
export function ProfileSetupNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Programme" component={ProgrammeScreen} />
      <Stack.Screen name="YearOfStudy" component={YearOfStudyScreen} />
      <Stack.Screen name="WellnessGoals" component={WellnessGoalsScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="PreferredSupport" component={PreferredSupportScreen} />
      <Stack.Screen name="Preparing" component={PreparingScreen} />
    </Stack.Navigator>
  );
}
