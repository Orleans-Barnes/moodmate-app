export type UserRole = 'STUDENT' | 'COUNSELLOR' | 'ADMIN';

export type MainTabParamList = {
  Home: undefined;
  Journal: undefined;
  Explore: undefined;
  Community: undefined;
  Insights: undefined;
  Support: undefined;
};

export type CounsellorTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Conversations: undefined;
  CounsellorProfile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  RoleSelect: undefined;
  Login: { role: UserRole };
  Signup: undefined;
  Onboarding: undefined;
  Main: undefined;
  AdminSetup: undefined;
  CounsellorSignup: undefined;
  ForgotPassword: { email?: string };
  ResetPassword: { email: string };
  AdminDashboard: undefined;

  CounsellorChat: { conversationId: number; studentName: string };
  Chat: { conversationId: number; otherPartyName: string };

  CheckIn: undefined;
  WellnessTree: undefined;
  GratitudeJar: undefined;
  JournalEntry: { template: string; icon: string };
  JournalView: { id: string; title: string; body: string; moodEmoji: string | null; date: string };
  BreathingSession: { session: string; duration: number };
  SOS: undefined;
  Profile: undefined;
  EditProfile: undefined;
  MoodHistory: undefined;
  Pro: undefined;
  Shop: undefined;
  Hub: undefined;
  Game: undefined;
  BubblePop: undefined;
  Grounding: undefined;
  MoodGate: undefined;
  MoodSuggest: { moodScore: number };
  WorryBox: undefined;
  SafePlace: undefined;
  ProudDandelion: undefined;
  AiChat: undefined;
  Resources: undefined;
  ThoughtDiary: undefined;
  HabitTracker: undefined;
  SleepTracker: undefined;
  PrivacyData: undefined;
  HelpSupport: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
