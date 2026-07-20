import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MainRouter } from './MainRouter';
import { SplashScreen } from '@/screens/SplashScreen';
import { RoleSelectScreen } from '@/screens/auth/RoleSelectScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { AdminSetupScreen } from '@/screens/admin/AdminSetupScreen';
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { CheckInScreen } from '@/screens/modals/CheckInScreen';
import { WellnessTreeScreen } from '@/screens/modals/WellnessTreeScreen';
import { GratitudeJarScreen } from '@/screens/modals/GratitudeJarScreen';
import { JournalEntryScreen } from '@/screens/journal/JournalEntryScreen';
import { JournalViewScreen } from '@/screens/journal/JournalViewScreen';
import { BreathingSessionScreen } from '@/screens/modals/BreathingSessionScreen';
import { SOSScreen } from '@/screens/modals/SOSScreen';
import { ProfileScreen } from '@/screens/modals/ProfileScreen';
import { EditProfileScreen } from '@/screens/modals/EditProfileScreen';
import { MoodHistoryScreen } from '@/screens/modals/MoodHistoryScreen';
import { ProScreen } from '@/screens/modals/ProScreen';
import { ShopScreen } from '@/screens/modals/ShopScreen';
import { HubScreen } from '@/screens/modals/HubScreen';
import { GameScreen } from '@/screens/modals/GameScreen';
import { BubblePopScreen } from '@/screens/modals/BubblePopScreen';
import { GroundingScreen } from '@/screens/modals/GroundingScreen';
import { WorryBoxScreen } from '@/screens/modals/WorryBoxScreen';
import { SafePlaceScreen } from '@/screens/modals/SafePlaceScreen';
import { ProudDandelionScreen } from '@/screens/modals/ProudDandelionScreen';
import { CounsellorChatScreen } from '@/screens/counsellor/CounsellorChatScreen';
import { ChatScreen } from '@/screens/support/ChatScreen';
import { MoodGateScreen } from '@/screens/gamification/MoodGateScreen';
import { MoodSuggestScreen } from '@/screens/gamification/MoodSuggestScreen';
import { AIChatScreen } from '@/screens/insights/AIChatScreen';
import { ResourcesScreen } from '@/screens/resources/ResourcesScreen';
import { ThoughtDiaryScreen } from '@/screens/modals/ThoughtDiaryScreen';
import { HabitTrackerScreen } from '@/screens/modals/HabitTrackerScreen';
import { PrivacyDataScreen } from '@/screens/modals/PrivacyDataScreen';
import { HelpSupportScreen } from '@/screens/modals/HelpSupportScreen';
import { SleepTrackerScreen } from '@/screens/modals/SleepTrackerScreen';
import { CounsellorSignupScreen } from '@/screens/counsellor/CounsellorSignupScreen';

// ── Phase 1–3 expansion screens ──────────────────────────────────────────────
import { MoodAnalyticsScreen } from '@/screens/insights/MoodAnalyticsScreen';
import { DBTSkillsScreen } from '@/screens/modals/DBTSkillsScreen';
import { MeditationLibraryScreen } from '@/screens/modals/MeditationLibraryScreen';
import { ActivationPlannerScreen } from '@/screens/modals/ActivationPlannerScreen';
import { WeeklyReportScreen } from '@/screens/modals/WeeklyReportScreen';
import { ThoughtSorterScreen } from '@/screens/modals/ThoughtSorterScreen';
import { CalmGardenScreen } from '@/screens/modals/CalmGardenScreen';

// ── Counsellor discovery ──────────────────────────────────────────────────────
import { CounsellorListScreen } from '@/screens/counsellor/CounsellorListScreen';
import { CounsellorProfileScreen } from '@/screens/counsellor/CounsellorProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Main" component={MainRouter} />
      <Stack.Screen name="AdminSetup" component={AdminSetupScreen} />
      <Stack.Screen name="CounsellorSignup" component={CounsellorSignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="CounsellorChat" component={CounsellorChatScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />

      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
        <Stack.Screen name="WellnessTree" component={WellnessTreeScreen} />
        <Stack.Screen name="GratitudeJar" component={GratitudeJarScreen} />
        <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
        <Stack.Screen name="JournalView" component={JournalViewScreen} />
        <Stack.Screen name="MoodHistory" component={MoodHistoryScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="BreathingSession" component={BreathingSessionScreen} />
        <Stack.Screen name="SOS" component={SOSScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Pro" component={ProScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="Hub" component={HubScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="BubblePop" component={BubblePopScreen} />
        <Stack.Screen name="Grounding" component={GroundingScreen} />
        <Stack.Screen name="WorryBox" component={WorryBoxScreen} />
        <Stack.Screen name="SafePlace" component={SafePlaceScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="ProudDandelion" component={ProudDandelionScreen} />
        <Stack.Screen name="AiChat" component={AIChatScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Resources" component={ResourcesScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ThoughtDiary" component={ThoughtDiaryScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="HabitTracker" component={HabitTrackerScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="SleepTracker" component={SleepTrackerScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="PrivacyData" component={PrivacyDataScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ animation: 'slide_from_bottom' }} />

        {/* ── Phase 1–3 expansion screens ─────────────────────────────────── */}
        <Stack.Screen name="MoodAnalytics" component={MoodAnalyticsScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="DBTSkills" component={DBTSkillsScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="MeditationLibrary" component={MeditationLibraryScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ActivationPlanner" component={ActivationPlannerScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ThoughtSorter" component={ThoughtSorterScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="CalmGarden" component={CalmGardenScreen} options={{ animation: 'slide_from_bottom' }} />

        {/* ── Counsellor discovery ─────────────────────────────────────────── */}
        <Stack.Screen name="CounsellorList" component={CounsellorListScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="CounsellorProfile" component={CounsellorProfileScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Group>
      <Stack.Screen name="MoodGate" component={MoodGateScreen} />
      <Stack.Screen name="MoodSuggest" component={MoodSuggestScreen} />
    </Stack.Navigator>
  );
}
