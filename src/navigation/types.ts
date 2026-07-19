// Phase 1G - added MENTOR alongside COUNSELLOR/ADMIN, routed to MentorTabs by MainRouter.tsx.
export type UserRole = 'STUDENT' | 'COUNSELLOR' | 'MENTOR' | 'ADMIN';

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

// Phase 1G - no Appointments tab: peer mentors don't do bookings, only requests + messaging.
export type MentorTabParamList = {
  Dashboard: undefined;
  Conversations: undefined;
  CounsellorProfile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  RoleSelect: undefined;
  Login: { role: UserRole };
  Signup: undefined;
  Onboarding: undefined;
  ProfileSetup: undefined;
  Main: undefined;
  AdminSetup: undefined;
  CounsellorSignup: undefined;
  CounsellorOrMentor: undefined;
  PeerMentorSignup: undefined;
  ForgotPassword: { email?: string };
  ResetPassword: { email: string };
  AdminDashboard: undefined;
  AdminUserManagement: undefined;
  AdminCounsellorMentorManagement: undefined;
  AdminWellnessContent: undefined;
  AdminModeration: undefined;
  AdminSystemSettings: undefined;
  AdminAuditLog: undefined;

  CounsellorChat: { conversationId: number; studentName: string };
  MentorChat: { conversationId: number; studentName: string };
  Chat: { conversationId: number; otherPartyName: string };

  // Phase 1F-B - the screen itself reads the logged-in role from useAuthStore to decide whether
  // to call the student or counsellor meeting-credentials endpoint, so no role flag is needed here.
  VideoSession: { appointmentId: number; otherPartyName: string };

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
  NotificationPreferences: undefined;
  NotificationCenter: undefined;
};

export type ProfileSetupStackParamList = {
  Welcome: undefined;
  Programme: undefined;
  YearOfStudy: undefined;
  WellnessGoals: undefined;
  Challenges: undefined;
  PreferredSupport: undefined;
  Preparing: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
