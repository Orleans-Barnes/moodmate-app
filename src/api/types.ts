// Mirrors the backend's auth DTOs exactly (com.moodmate.backend.auth.dto.UserProfileResponse /
// AuthResponse, com.moodmate.backend.auth.Role) - per IMPLEMENTATION_PLAN.md's guardrail, the
// backend DTO and this type get written together so the two repos never drift on what a "user"
// object looks like.

// Phase 1G - added MENTOR alongside COUNSELLOR/ADMIN, mirroring backend com.moodmate.auth.entity.Role.
export type Role = 'STUDENT' | 'COUNSELLOR' | 'MENTOR' | 'ADMIN';

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
  // Feature 4 (JWT Refresh Tokens) - backend has returned this since AuthResponse.java added it;
  // the frontend just never read it until Phase 1A wired up refresh handling.
  refreshToken: string;
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

// Phase 1H (Admin Portal - Community Moderation). Mirrors
// com.moodmate.community.dto.ReportResponse / entity.ContentType / entity.ReportStatus exactly -
// this backend was already fully built (Feature 7) before this pass; only the admin frontend was
// missing.
export type ContentType = 'POST' | 'COMMENT';
export type ReportStatus = 'PENDING' | 'DISMISSED' | 'CONTENT_REMOVED';

export interface ReportView {
  id: number;
  contentType: ContentType;
  contentId: number;
  postId: number;
  contentPreview: string | null;
  contentAuthorId: number | null;
  reporterId: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
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
// Mirrors com.moodmate.support.entity.CounsellorAvailabilityStatus (Phase 1F-A) - a counsellor's
// real-time-ish self-reported status, distinct from CounsellorStatus (the PENDING/APPROVED/
// REJECTED account-request workflow, an unrelated concept on the same entity).
export type CounsellorAvailabilityStatus = 'ONLINE' | 'BUSY' | 'AWAY';

export interface CounsellorView {
  id: number;
  name: string;
  title: string;
  bio: string;
  avatarEmoji: string;
  specialties: string[];
  available: boolean;
  availabilityStatus: CounsellorAvailabilityStatus;
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

// Mirrors com.moodmate.support.dto.RescheduleAppointmentRequest (Phase 1F-A) - scheduledAt must
// be a future ISO instant, validated backend-side (@Future).
export interface RescheduleAppointmentRequest {
  scheduledAt: string;
}

// Mirrors com.moodmate.support.dto.CounsellorAnalyticsResponse (Phase 1F-A) - backs
// GET /api/support/counsellor/analytics. All counts are lifetime, not windowed.
export interface CounsellorAnalyticsView {
  totalAppointments: number;
  upcomingCount: number;
  completedCount: number;
  missedCount: number;
  cancelledCount: number;
  completionRate: number;
}

// Mirrors com.moodmate.support.dto.MeetingWindowView (Phase 1F-B) - backs
// GET /api/support/appointments/{id}/meeting and .../counsellor/appointments/{id}/meeting.
// roomName/joinUrl are only populated when open is true; the backend withholds them entirely
// outside the authorized join window/identity, since 8x8.vc has no server-side room auth without
// a signed JWT (not configured yet - see MASTER_IMPLEMENTATION_TRACKER.md Phase 1F-B). When open
// is false, reason is one of 'NOT_CONFIRMED' | 'TOO_EARLY' | 'EXPIRED' and message is
// ready-to-display copy.
export interface MeetingWindowView {
  open: boolean;
  roomName: string | null;
  joinUrl: string | null;
  reason: 'NOT_CONFIRMED' | 'TOO_EARLY' | 'EXPIRED' | null;
  message: string | null;
  windowOpensAt: string;
  windowClosesAt: string;
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
  doubleXpActiveUntil: string | null;
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

// Mirrors com.moodmate.gamification.entity.UserAchievement (Task #25 - gamification wiring).
export interface UserAchievementView {
  id: number;
  userId: number;
  achievementKey: string;
  earnedAt: string;
}

// Mirrors com.moodmate.wallet.dto.LeafPackDto / CheckoutResponse / PaymentTransactionDto
// (Task #26 - Shop/Pro payment wiring).
export interface LeafPackView {
  code: string;
  leaves: number;
  pricePesewas: number;
}

export interface CheckoutResponseView {
  authorizationUrl: string;
  reference: string;
}

export type PaymentPurposeKey = 'SUBSCRIPTION' | 'LEAF_PACK';
export type PaymentStatusKey = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentTransactionView {
  reference: string;
  purpose: PaymentPurposeKey;
  itemCode: string;
  amountPesewas: number;
  currency: string;
  status: PaymentStatusKey;
  paidAt: string | null;
  createdAt: string;
}

// Mirrors com.moodmate.auth.profile.* (Phase 1C-i) exactly — enum names below are the literal
// wire values (see PHASE_1C_I_API_CONTRACT.md "API version stability": enum constant names are
// part of the API contract, renaming one is a breaking change). Display labels for these live in
// the ProfileSetup screens, not here — this file only mirrors the backend shapes.
export type Programme =
  | 'COMPUTER_SCIENCE' | 'INFORMATION_TECHNOLOGY' | 'COMPUTER_ENGINEERING'
  | 'ELECTRICAL_ENGINEERING' | 'MECHANICAL_ENGINEERING' | 'CIVIL_ENGINEERING'
  | 'BUSINESS_ADMINISTRATION' | 'ACCOUNTING' | 'MEDICINE' | 'NURSING' | 'PHARMACY'
  | 'LAW' | 'PSYCHOLOGY' | 'ECONOMICS' | 'AGRICULTURE' | 'ARCHITECTURE' | 'OTHER';

export type YearOfStudy =
  | 'FIRST_YEAR' | 'SECOND_YEAR' | 'THIRD_YEAR' | 'FOURTH_YEAR' | 'FIFTH_YEAR' | 'POSTGRADUATE';

export type WellnessGoal =
  | 'LESS_STRESS' | 'BETTER_SLEEP' | 'MORE_CONFIDENT' | 'BETTER_FOCUS' | 'BETTER_GRADES'
  | 'TRACK_EMOTIONS' | 'BUILD_HEALTHY_HABITS' | 'CONNECT_WITH_SUPPORT' | 'MORE_MOTIVATION';

export type Challenge =
  | 'ACADEMIC_PRESSURE' | 'LONELINESS' | 'ANXIETY' | 'BURNOUT' | 'FINANCIAL_STRESS'
  | 'RELATIONSHIPS' | 'TIME_MANAGEMENT' | 'CAREER_CONCERNS';

export type PreferredSupport =
  | 'AI_COACH' | 'COUNSELLOR' | 'PEER_MENTOR' | 'JOURNALING' | 'BREATHING'
  | 'COMMUNITY' | 'SELF_GUIDED';

export interface StudentProfileRequest {
  programme?: Programme | null;
  yearOfStudy?: YearOfStudy | null;
}

export interface StudentProfileResponse {
  programme: Programme | null;
  yearOfStudy: YearOfStudy | null;
  updatedAt: string;
}

export interface WellnessPreferenceRequest {
  goals?: WellnessGoal[] | null;
  challenges?: Challenge[] | null;
  preferredSupport?: PreferredSupport[] | null;
}

export interface WellnessPreferenceResponse {
  goals: WellnessGoal[];
  challenges: Challenge[];
  preferredSupport: PreferredSupport[];
  completed: boolean;
  skipped: boolean;
  completedAt: string | null;
  skippedAt: string | null;
  updatedAt: string;
}

export interface ProfileStatusResponse {
  profileCompletion: number;
  needsAcademicProfile: boolean;
  needsGoals: boolean;
  canShowOnboarding: boolean;
}

// Mirrors com.moodmate.auth.profile.dto.NotificationPreferenceRequest/Response (Phase 1E, Step 1).
// quietHoursStart/End are "HH:mm" strings, null when not configured - same wire format both ways,
// server-side format validation happens in NotificationPreferenceService, not here. Sending ""
// (empty string, not null) for either quiet-hours field clears it; omitting a field (undefined)
// leaves it untouched server-side - same partial-update semantics as WellnessPreferenceRequest.
export interface NotificationPreferenceRequest {
  moodReminders?: boolean;
  journalReminders?: boolean;
  habitReminders?: boolean;
  sleepReminders?: boolean;
  appointmentReminders?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NotificationPreferenceResponse {
  moodReminders: boolean;
  journalReminders: boolean;
  habitReminders: boolean;
  sleepReminders: boolean;
  appointmentReminders: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  updatedAt: string;
}

// Mirrors com.moodmate.notifications.entity.NotificationType/NotificationStatus and
// dto.NotificationResponse (Phase 1E, Step 2 - the moodmate-notifications microservice). Enum
// constant names below are the literal wire values, same "written together" rule as every other
// backend-mirroring type in this file.
export type NotificationTypeKey =
  | 'MOOD_REMINDER' | 'JOURNAL_REMINDER' | 'HABIT_REMINDER' | 'SLEEP_REMINDER'
  | 'APPOINTMENT_BOOKED' | 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_COMPLETED' | 'APPOINTMENT_REMINDER'
  | 'MENTOR_REQUEST' | 'MENTOR_ACCEPTED' | 'MENTOR_DECLINED'
  | 'CRISIS_ALERT' | 'ARTICLE_PUBLISHED' | 'EVENT_REMINDER'
  | 'ACHIEVEMENT_UNLOCKED' | 'MISSION_COMPLETED' | 'ADMIN_ANNOUNCEMENT' | 'SYSTEM';

export type NotificationStatusKey = 'PENDING' | 'SCHEDULED' | 'DELIVERED' | 'READ' | 'FAILED';

export interface NotificationView {
  id: number;
  type: NotificationTypeKey;
  title: string;
  body: string;
  destinationScreen: string | null;
  destinationParams: string | null;
  status: NotificationStatusKey;
  scheduledAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

// Mirrors com.moodmate.support.entity.MentorRequestStatus / dto.MentorRequestResponse /
// dto.MentorRequestView / dto.RequestMentorRequest (Phase 1G - Peer Mentor request/accept
// workflow). Student -> request -> mentor accepts/declines -> conversation created, replacing the
// old unconditional "message a mentor" flow.
export type MentorRequestStatusKey = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface RequestMentorRequest {
  peerMentorId: number;
  message?: string;
}

/** Student-side view of one of their own mentor requests - mirrors MentorRequestResponse.
 * conversationId is only set once ACCEPTED. */
export interface MentorRequestView {
  id: number;
  peerMentorId: number;
  mentorName: string;
  status: MentorRequestStatusKey;
  message: string | null;
  conversationId: number | null;
  createdAt: string;
  respondedAt: string | null;
}

/** Mentor-side view of a request sent to them - mirrors backend's MentorRequestView DTO. Named
 * distinctly from the student-side MentorRequestView above to avoid a naming collision. */
export interface MentorRequestForMentorView {
  id: number;
  userId: number;
  studentName: string;
  status: MentorRequestStatusKey;
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
}

