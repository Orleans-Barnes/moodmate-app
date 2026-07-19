import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { MainRouter } from './MainRouter';
import { SplashScreen } from '@/screens/SplashScreen';
import { RoleSelectScreen } from '@/screens/auth/RoleSelectScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { ProfileSetupNavigator } from './ProfileSetupNavigator';
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
import { MentorChatScreen } from '@/screens/mentor/MentorChatScreen';
import { ChatScreen } from '@/screens/support/ChatScreen';
import { MoodGateScreen } from '@/screens/gamification/MoodGateScreen';
import { MoodSuggestScreen } from '@/screens/gamification/MoodSuggestScreen';
import { AIChatScreen } from '@/screens/insights/AIChatScreen';
import { ResourcesScreen } from '@/screens/resources/ResourcesScreen';
import { ThoughtDiaryScreen } from '@/screens/modals/ThoughtDiaryScreen';
import { HabitTrackerScreen } from '@/screens/modals/HabitTrackerScreen';
import { PrivacyDataScreen } from '@/screens/modals/PrivacyDataScreen';
import { HelpSupportScreen } from '@/screens/modals/HelpSupportScreen';
import { NotificationPreferencesScreen } from '@/screens/modals/NotificationPreferencesScreen';
import { NotificationCenterScreen } from '@/screens/modals/NotificationCenterScreen';
import { SleepTrackerScreen } from '@/screens/modals/SleepTrackerScreen';
import { CounsellorSignupScreen } from '@/screens/counsellor/CounsellorSignupScreen';
import { CounsellorOrMentorScreen } from '@/screens/counsellor/CounsellorOrMentorScreen';
import { PeerMentorSignupScreen } from '@/screens/counsellor/PeerMentorSignupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupNavigator} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Main" component={MainRouter} />
      <Stack.Screen name="AdminSetup" component={AdminSetupScreen} />
      <Stack.Screen name="CounsellorSignup" component={CounsellorSignupScreen} />
      <Stack.Screen name="CounsellorOrMentor" component={CounsellorOrMentorScreen} />
      <Stack.Screen name="PeerMentorSignup" component={PeerMentorSignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="CounsellorChat" component={CounsellorChatScreen} />
      <Stack.Screen name="MentorChat" component={MentorChatScreen} />
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
        <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} options={{ animation: 'slide_from_bottom' }} />
      </Stack.Group>
      <Stack.Screen name="MoodGate" component={MoodGateScreen} />
      <Stack.Screen name="MoodSuggest" component={MoodSuggestScreen} />
    </Stack.Navigator>
  );
}
