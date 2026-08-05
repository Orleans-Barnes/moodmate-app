// Mirrors the backend's auth DTOs exactly (com.moodmate.backend.auth.dto.UserProfileResponse /
// AuthResponse, com.moodmate.backend.auth.Role) - per IMPLEMENTATION_PLAN.md's guardrail, the
// backend DTO and this type get written together so the two repos never drift on what a "user"
// object looks like.

export type Role = 'STUDENT' | 'COUNSELLOR' | 'ADMIN';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  institution: string | null;
  avatarEmoji: string;
  avatarUrl?: string | null;  // set when user has uploaded a real photo
  guest: boolean;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

// Mirrors com.moodmate.backend.support.AppointmentStatus / SenderType, and the
// CounsellorAppointmentView / CounsellorConversationView / MessageResponse DTOs added in
// Phase 2 Part B - same "write the type and the DTO together" rule as the auth types above.

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type SenderType = 'USER' | 'COUNSELLOR' | 'PEER_MENTOR';

export interface CounsellorAppointmentView {
  id: number;
  userId: number;
  studentName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
}

export interface CounsellorConversationView {
  id: number;
  userId: number;
  studentName: string;
  createdAt: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderType: SenderType;
  body: string;
  createdAt: string;
  readAt: string | null;
}

// Minimal shape of a Spring Data Page<T> response - only the field these screens use.
export interface PageResponse<T> {
  content: T[];
}

// Mirrors com.moodmate.backend.journal.dto.JournalEntryResponse / JournalEntryRequest
// (Phase 3, Task #7 - Journal wired first per IMPLEMENTATION_PLAN.md).
export interface JournalEntryView {
  id: number;
  title: string | null;
  body: string;
  moodEmoji: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryCreateRequest {
  title?: string;
  body: string;
  moodEmoji?: string;
}

// Mirrors com.moodmate.backend.community.ReactionType / dto.PostResponse / ReactionSummaryDto /
// CreatePostRequest / ReactResponse (Phase 3, Task #7 - Community wired next per
// IMPLEMENTATION_PLAN.md). The backend always returns all 4 enum values names exactly as below.
export type ReactionType = 'HEART' | 'PRAYER' | 'MUSCLE' | 'PARTY';

export interface ReactionSummaryView {
  type: ReactionType;
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface CommunityPostView {
  id: number;
  authorHandle: string;
  topic: string;
  content: string;
  createdAt: string;
  reactions: ReactionSummaryView[];
  totalReactions: number;
  isOwnPost: boolean;
}

export interface CommunityPostCreateRequest {
  content: string;
  topic?: string;
}

export interface ReactResponseView {
  reactions: ReactionSummaryView[];
  totalReactions: number;
}

// Mirrors com.moodmate.backend.hub.dto.ArticleResponse / EventResponse (Phase 3, Task #7 -
// Explore/Support next per IMPLEMENTATION_PLAN.md).
export interface ArticleView {
  id: number;
  title: string;
  summary: string;
  body: string;
  category: string;
  readMinutes: number;
  imageEmoji: string;
  publishedAt: string;
}

export interface EventView {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  capacity: number | null;
  goingCount: number;
  rsvped: boolean;
}

// Mirrors com.moodmate.backend.sos.dto.SosResourceDto. This endpoint is deliberately public
// and unauthenticated server-side (see SosController) - never gate it behind a token or Pro
// check on the frontend either.
export interface SosResourceView {
  id: number;
  name: string;
  description: string;
  phone: string | null;
  url: string | null;
  country: string;
}

// Mirrors com.moodmate.backend.support.dto.CounsellorDto / PeerMentorDto / AppointmentResponse /
// ConversationResponse / BookAppointmentRequest / StartConversationRequest - student-side Support
// wiring (Phase 3, Task #7). The counsellor-perspective types above (CounsellorAppointmentView,
// CounsellorConversationView) already existed from Phase 2 Part B; these are the matching
// student-perspective shapes for the same backend domain.
export interface CounsellorView {
  id: number;
  name: string;
  title: string;
  bio: string;
  avatarEmoji: string;
  specialties: string[];
  available: boolean;
}

export interface MentorView {
  id: number;
  name: string;
  bio: string;
  avatarEmoji: string;
  focusArea: string;
  available: boolean;
}

export interface AppointmentView {
  id: number;
  counsellorId: number;
  counsellorName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
}

export interface BookAppointmentRequest {
  counsellorId: number;
  scheduledAt: string;
  notes?: string;
}

export interface ConversationView {
  id: number;
  counsellorId: number | null;
  counsellorName: string | null;
  peerMentorId: number | null;
  peerMentorName: string | null;
  createdAt: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

// Exactly one of counsellorId / peerMentorId must be set - validated backend-side.
export interface StartConversationRequest {
  counsellorId?: number;
  peerMentorId?: number;
}

// Mirrors com.moodmate.backend.checkin.Emotion / dto.CheckInRequest / CheckInResponse (Phase 3,
// Task #7 - Checkin wiring). The enum values must match Emotion.java exactly; the frontend's
// EmotionWheel component already uses the same 10 labels uppercased, so no extra mapping table
// is needed - see CheckInScreen.tsx.
export type EmotionKey =
  | 'HAPPY'
  | 'CALM'
  | 'HOPEFUL'
  | 'GRATEFUL'
  | 'MOTIVATED'
  | 'ANXIOUS'
  | 'STRESSED'
  | 'LONELY'
  | 'OVERWHELMED'
  | 'FRUSTRATED';

export interface CheckInRequest {
  emotionKey: EmotionKey;
  stressLevel: number;
  energyLevel: number;
  note?: string;
}

export interface CheckInResponse {
  id: number;
  emotionKey: EmotionKey;
  stressLevel: number;
  energyLevel: number;
  note: string | null;
  createdAt: string;
}

// Mirrors com.moodmate.backend.gratitude.dto.GratitudeEntryRequest / GratitudeEntryResponse
// (Phase 3, Task #7 - Gratitude Jar wiring).
export interface GratitudeEntryView {
  id: number;
  content: string;
  createdAt: string;
}

export interface GratitudeEntryCreateRequest {
  content: string;
}

// Mirrors com.moodmate.backend.wellness.dto / com.moodmate.backend.wallet.dto
// (Phase 3, Task #7 - Wallet/Wellness Tree wiring).
export type TreeStageKey = 'ROOTS' | 'SPROUT' | 'BLOOM' | 'CANOPY';

export interface GoalView {
  templateId: number;
  key: string;
  label: string;
  xp: number;
  done: boolean;
}

export interface WellnessStateView {
  treeXp: number;
  treeXpMax: number;
  treeStage: TreeStageKey;
  treeSkinEmoji: string;
  leafBalance: number;
  streakCount: number;
  lastAllGoalsCompletedDate: string | null;
  todaysGoals: GoalView[];
  hasStreakShield: boolean;
}

export interface ToggleGoalResponseView {
  state: WellnessStateView;
  streakIncrementedThisToggle: boolean;
}

export interface SkinView {
  id: number;
  code: string;
  emoji: string;
  name: string;
  cost: number;
  owned: boolean;
  equipped: boolean;
}

export interface WalletStateView {
  leafBalance: number;
  skins: SkinView[];
}

export interface PurchaseSkinResponseView {
  wallet: WalletStateView;
  alreadyOwned: boolean;
}

export type BillingIntervalKey = 'MONTH' | 'YEAR';

export type SubscriptionStatusKey = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface SubscriptionPlanView {
  code: string;
  name: string;
  pricePesewas: number;
  billingInterval: BillingIntervalKey;
  trialDays: number;
}

export interface SubscriptionStateView {
  planCode: string | null;
  status: SubscriptionStatusKey | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  pro: boolean;
}
