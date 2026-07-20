import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import type {
  AppointmentView,
  BookAppointmentRequest,
  CounsellorAnalyticsView,
  CounsellorAppointmentView,
  CounsellorAvailabilityStatus,
  CounsellorConversationView,
  CounsellorView,
  ConversationView,
  MeetingWindowView,
  MentorRequestForMentorView,
  MentorRequestView,
  MentorView,
  MessageResponse,
  PageResponse,
  RequestMentorRequest,
  StartConversationRequest,
} from './types';

// Counsellor-side endpoints added in backend Phase 2 Part B
// (com.moodmate.backend.support.SupportController, the "/counsellor/..." routes).
// All require a token belonging to a COUNSELLOR-role user - the backend enforces
// this with @PreAuthorize, this file just calls it.

export function listCounsellorAppointments(token: string): Promise<CounsellorAppointmentView[]> {
  return apiGet<CounsellorAppointmentView[]>('/api/support/counsellor/appointments', token);
}

export function confirmAppointment(token: string, appointmentId: number): Promise<CounsellorAppointmentView> {
  return apiPost<CounsellorAppointmentView>(
    `/api/support/counsellor/appointments/${appointmentId}/confirm`,
    undefined,
    token
  );
}

export function completeAppointment(token: string, appointmentId: number): Promise<CounsellorAppointmentView> {
  return apiPost<CounsellorAppointmentView>(
    `/api/support/counsellor/appointments/${appointmentId}/complete`,
    undefined,
    token
  );
}

export function cancelAppointmentAsCounsellor(
  token: string,
  appointmentId: number
): Promise<CounsellorAppointmentView> {
  return apiPost<CounsellorAppointmentView>(
    `/api/support/counsellor/appointments/${appointmentId}/cancel`,
    undefined,
    token
  );
}

export function listCounsellorConversations(token: string): Promise<CounsellorConversationView[]> {
  return apiGet<CounsellorConversationView[]>('/api/support/counsellor/conversations', token);
}

export function listCounsellorMessages(
  token: string,
  conversationId: number
): Promise<PageResponse<MessageResponse>> {
  return apiGet<PageResponse<MessageResponse>>(
    `/api/support/counsellor/conversations/${conversationId}/messages?page=0&size=50`,
    token
  );
}

export function sendCounsellorMessage(
  token: string,
  conversationId: number,
  body: string
): Promise<MessageResponse> {
  return apiPost<MessageResponse>(
    `/api/support/counsellor/conversations/${conversationId}/messages`,
    { body },
    token
  );
}

export function markCounsellorRead(token: string, conversationId: number): Promise<void> {
  return apiPost<void>(`/api/support/counsellor/conversations/${conversationId}/read`, undefined, token);
}

// Phase 1F-A - persists the dashboard's Online/Busy/Away toggle (previously local-only React
// state, never seen by students). Read back via GET /api/support/counsellors' availabilityStatus.
export function setCounsellorAvailabilityStatus(
  token: string,
  availabilityStatus: CounsellorAvailabilityStatus
): Promise<CounsellorAvailabilityStatus> {
  return apiPost<CounsellorAvailabilityStatus>(
    '/api/support/counsellor/availability-status',
    { availabilityStatus },
    token
  );
}

// Phase 1F-A - backs the counsellor dashboard's analytics cards.
export function getCounsellorAnalytics(token: string): Promise<CounsellorAnalyticsView> {
  return apiGet<CounsellorAnalyticsView>('/api/support/counsellor/analytics', token);
}

// Phase 1F-B - Jitsi meeting credentials, counsellor side. Only ever returns a real
// roomName/joinUrl when the backend's join window is open - see MeetingWindowView's doc comment.
export function getCounsellorAppointmentMeeting(
  token: string,
  appointmentId: number
): Promise<MeetingWindowView> {
  return apiGet<MeetingWindowView>(`/api/support/counsellor/appointments/${appointmentId}/meeting`, token);
}

// Student-side endpoints (com.moodmate.backend.support.SupportController, the non-"/counsellor/..."
// routes) - Phase 3, Task #7. A Counsellor can be booked AND messaged; a PeerMentor can only be
// messaged (no booking endpoint exists for mentors - mirrors the backend, which has none either).

export function listCounsellors(token: string): Promise<CounsellorView[]> {
  return apiGet<CounsellorView[]>('/api/support/counsellors', token);
}

export function listMentors(token: string): Promise<MentorView[]> {
  return apiGet<MentorView[]>('/api/support/mentors', token);
}

// Phase 1G - Peer Mentor request/accept workflow, student side. Messaging a mentor now requires
// an ACCEPTED request first (see useSupportStore's openConversation / SupportScreen's mentor
// roster cards for how this gates the "Message" button).

export function requestMentor(token: string, request: RequestMentorRequest): Promise<MentorRequestView> {
  return apiPost<MentorRequestView>('/api/support/mentor-requests', request, token);
}

export function listMyMentorRequests(token: string): Promise<MentorRequestView[]> {
  return apiGet<MentorRequestView[]>('/api/support/mentor-requests', token);
}

// ── Mentor-side endpoints (com.moodmate.support.SupportController, the "/mentor/..." routes) -
// require a token belonging to a MENTOR-role user, mirroring the "/counsellor/..." endpoints
// above exactly. ─────────────────────────────────────────────────────────────────────────────

export function listMentorRequestsForMentor(token: string): Promise<MentorRequestForMentorView[]> {
  return apiGet<MentorRequestForMentorView[]>('/api/support/mentor/requests', token);
}

export function acceptMentorRequest(token: string, requestId: number): Promise<MentorRequestForMentorView> {
  return apiPost<MentorRequestForMentorView>(`/api/support/mentor/requests/${requestId}/accept`, undefined, token);
}

export function declineMentorRequest(token: string, requestId: number): Promise<MentorRequestForMentorView> {
  return apiPost<MentorRequestForMentorView>(`/api/support/mentor/requests/${requestId}/decline`, undefined, token);
}

export function listMentorConversations(token: string): Promise<CounsellorConversationView[]> {
  return apiGet<CounsellorConversationView[]>('/api/support/mentor/conversations', token);
}

export function listMentorMessages(
  token: string,
  conversationId: number
): Promise<PageResponse<MessageResponse>> {
  return apiGet<PageResponse<MessageResponse>>(
    `/api/support/mentor/conversations/${conversationId}/messages?page=0&size=50`,
    token
  );
}

export function sendMentorMessage(
  token: string,
  conversationId: number,
  body: string
): Promise<MessageResponse> {
  return apiPost<MessageResponse>(
    `/api/support/mentor/conversations/${conversationId}/messages`,
    { body },
    token
  );
}

export function markMentorRead(token: string, conversationId: number): Promise<void> {
  return apiPost<void>(`/api/support/mentor/conversations/${conversationId}/read`, undefined, token);
}

// Admin-only account linkage - see SupportService.linkMentorAccount's doc comment for why this
// is admin-driven rather than a self-serve request/approve flow.
export function linkMentorAccount(token: string, mentorId: number, userId: number): Promise<MentorView> {
  return apiPost<MentorView>(`/api/support/mentors/${mentorId}/link-account`, { userId }, token);
}

export function bookAppointment(token: string, request: BookAppointmentRequest): Promise<AppointmentView> {
  return apiPost<AppointmentView>('/api/support/appointments', request, token);
}

export function listAppointments(token: string): Promise<AppointmentView[]> {
  return apiGet<AppointmentView[]>('/api/support/appointments', token);
}

export function cancelAppointment(token: string, appointmentId: number): Promise<AppointmentView> {
  return apiPost<AppointmentView>(`/api/support/appointments/${appointmentId}/cancel`, undefined, token);
}

// Phase 1F-A - student-initiated reschedule. scheduledAt must be a future ISO instant.
export function rescheduleAppointment(
  token: string,
  appointmentId: number,
  scheduledAt: string
): Promise<AppointmentView> {
  return apiPost<AppointmentView>(
    `/api/support/appointments/${appointmentId}/reschedule`,
    { scheduledAt },
    token
  );
}

// Fix #5 - student rates a COMPLETED counsellor appointment, one rating per appointment
// (backend enforces via a unique constraint + a 409 conflict if already rated).
export interface CounsellorRatingResponse {
  id: number;
  appointmentId: number;
  stars: number;
  comment: string | null;
  createdAt: string;
}

export function submitCounsellorRating(
  token: string,
  appointmentId: number,
  stars: number,
  comment?: string
): Promise<CounsellorRatingResponse> {
  return apiPost<CounsellorRatingResponse>(
    `/api/support/appointments/${appointmentId}/rating`,
    { stars, comment },
    token
  );
}

// Phase 1F-B - Jitsi meeting credentials, student side. Only ever returns a real
// roomName/joinUrl when the backend's join window is open - see MeetingWindowView's doc comment.
export function getAppointmentMeeting(token: string, appointmentId: number): Promise<MeetingWindowView> {
  return apiGet<MeetingWindowView>(`/api/support/appointments/${appointmentId}/meeting`, token);
}

// Exactly one of counsellorId / peerMentorId must be set on the request - backend validates this.
export function startConversation(token: string, request: StartConversationRequest): Promise<ConversationView> {
  return apiPost<ConversationView>('/api/support/conversations', request, token);
}

export function listConversations(token: string): Promise<ConversationView[]> {
  return apiGet<ConversationView[]>('/api/support/conversations', token);
}

export function listMessages(token: string, conversationId: number): Promise<PageResponse<MessageResponse>> {
  return apiGet<PageResponse<MessageResponse>>(
    `/api/support/conversations/${conversationId}/messages?page=0&size=50`,
    token
  );
}

export function sendMessage(token: string, conversationId: number, body: string): Promise<MessageResponse> {
  return apiPost<MessageResponse>(`/api/support/conversations/${conversationId}/messages`, { body }, token);
}

export function markRead(token: string, conversationId: number): Promise<void> {
  return apiPost<void>(`/api/support/conversations/${conversationId}/read`, undefined, token);
}

// ── Admin-only endpoints ─────────────────────────────────────────────────────

// Phase 1H - SUSPENDED added alongside the pre-existing PENDING/APPROVED/REJECTED, an
// admin-reversible state for an already-APPROVED counsellor (mirrors
// com.moodmate.support.entity.CounsellorStatus exactly).
export interface CounsellorRequestAdminView {
  id: number;
  userId: number;
  name: string;
  title: string;
  bio: string;
  specialties: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

export function listPendingCounsellorRequests(token: string): Promise<CounsellorRequestAdminView[]> {
  return apiGet<CounsellorRequestAdminView[]>('/api/support/counsellor-requests/pending', token);
}

export function approveCounsellorRequest(token: string, id: number): Promise<CounsellorRequestAdminView> {
  return apiPost<CounsellorRequestAdminView>(`/api/support/counsellor-requests/${id}/approve`, undefined, token);
}

export function rejectCounsellorRequest(token: string, id: number): Promise<CounsellorRequestAdminView> {
  return apiPost<CounsellorRequestAdminView>(`/api/support/counsellor-requests/${id}/reject`, undefined, token);
}

// Phase 1H (Admin Portal - Counsellor Management) - the full roster (any status), plus
// suspend/reinstate/edit for an already-APPROVED row. Kept under the same "/counsellor-requests"
// prefix as approve/reject above - same Counsellor row/id space, just a superset of actions.

export function listAllCounsellorsForAdmin(token: string): Promise<CounsellorRequestAdminView[]> {
  return apiGet<CounsellorRequestAdminView[]>('/api/support/counsellor-requests', token);
}

export function suspendCounsellor(token: string, id: number): Promise<CounsellorRequestAdminView> {
  return apiPost<CounsellorRequestAdminView>(`/api/support/counsellor-requests/${id}/suspend`, undefined, token);
}

export function reinstateCounsellor(token: string, id: number): Promise<CounsellorRequestAdminView> {
  return apiPost<CounsellorRequestAdminView>(`/api/support/counsellor-requests/${id}/reinstate`, undefined, token);
}

export interface AdminEditCounsellorInput {
  title?: string;
  bio?: string;
  specialties?: string;
  sortOrder?: number;
}

export function adminEditCounsellor(
  token: string,
  id: number,
  input: AdminEditCounsellorInput
): Promise<CounsellorRequestAdminView> {
  return apiPatch<CounsellorRequestAdminView>(`/api/support/counsellor-requests/${id}`, input, token);
}

// Phase 1H (Admin Portal - Peer Mentor Management) - "Manage" here means the full roster
// (including deactivated rows) plus an activate/deactivate toggle for an already-APPROVED mentor.
// The pending-application approve/reject queue is the separate block below (Fix #4).

export interface PeerMentorAdminView {
  id: number;
  userId: number | null;
  name: string;
  bio: string;
  avatarEmoji: string;
  focusArea: string;
  available: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function listAllMentorsForAdmin(token: string): Promise<PeerMentorAdminView[]> {
  return apiGet<PeerMentorAdminView[]>('/api/support/mentors/admin', token);
}

export function deactivateMentor(token: string, id: number): Promise<PeerMentorAdminView> {
  return apiPost<PeerMentorAdminView>(`/api/support/mentors/${id}/deactivate`, undefined, token);
}

export function activateMentor(token: string, id: number): Promise<PeerMentorAdminView> {
  return apiPost<PeerMentorAdminView>(`/api/support/mentors/${id}/activate`, undefined, token);
}

// Fix #4 (Peer Mentor self-serve application flow) - mirrors the counsellor-requests functions
// above field-for-field. Bio and focusArea are the only fields asked for (PeerMentor has no
// "title" field like Counsellor does); name/avatar come from the requester's own profile.

export interface PeerMentorApplicationInput {
  bio: string;
  focusArea?: string;
}

export function submitMentorApplication(
  token: string,
  input: PeerMentorApplicationInput,
): Promise<{ id: number; status: string }> {
  return apiPost<{ id: number; status: string }>('/api/support/mentor-applications', input, token);
}

export function listPendingMentorApplications(token: string): Promise<PeerMentorAdminView[]> {
  return apiGet<PeerMentorAdminView[]>('/api/support/mentor-applications/pending', token);
}

export function approveMentorApplication(token: string, id: number): Promise<PeerMentorAdminView> {
  return apiPost<PeerMentorAdminView>(`/api/support/mentor-applications/${id}/approve`, undefined, token);
}

export function rejectMentorApplication(token: string, id: number): Promise<PeerMentorAdminView> {
  return apiPost<PeerMentorAdminView>(`/api/support/mentor-applications/${id}/reject`, undefined, token);
}

// ── Admin endpoints ───────────────────────────────────────────────────────

export interface AdminStats {
  totalStudents: number;
  totalCounsellors: number;
  totalAppointments: number;
  pendingCounsellorRequests: number;
  totalCommunityPosts: number;
}

export function getAdminStats(token: string): Promise<AdminStats> {
  return apiGet('/api/admin/stats', token);
}

// Self-serve counsellor application — any authenticated student can submit this.
// title and bio are required; specialties is optional.
export interface CounsellorApplicationInput {
  title: string;
  bio: string;
  specialties?: string;
}

export function submitCounsellorRequest(
  token: string,
  input: CounsellorApplicationInput,
): Promise<{ id: number; status: string }> {
  return apiPost<{ id: number; status: string }>('/api/support/counsellor-requests', input, token);
}

// ── Counsellor Whitelist (admin-only) ─────────────────────────────────────

export interface WhitelistEntry {
  id: number;
  email: string;
  notes: string | null;
  addedAt: string;
}

export function getWhitelist(token: string): Promise<WhitelistEntry[]> {
  return apiGet<WhitelistEntry[]>('/api/admin/whitelist', token);
}

export function addToWhitelist(token: string, email: string, notes?: string): Promise<WhitelistEntry> {
  return apiPost<WhitelistEntry>('/api/admin/whitelist', { email, notes }, token);
}

export function removeFromWhitelist(token: string, email: string): Promise<void> {
  return apiDelete(`/api/admin/whitelist/${encodeURIComponent(email)}`, token);
}

// ── Phase 1H (Admin Portal - System Settings: Feature Flags) ──────────────

export interface FeatureFlagView {
  id: number;
  flagKey: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
}

export function listFeatureFlags(token: string): Promise<FeatureFlagView[]> {
  return apiGet<FeatureFlagView[]>('/api/admin/feature-flags', token);
}

export function createFeatureFlag(
  token: string,
  flagKey: string,
  enabled: boolean,
  description?: string
): Promise<FeatureFlagView> {
  return apiPost<FeatureFlagView>('/api/admin/feature-flags', { flagKey, enabled, description }, token);
}

export function setFeatureFlagEnabled(token: string, id: number, enabled: boolean): Promise<FeatureFlagView> {
  return apiPatch<FeatureFlagView>(`/api/admin/feature-flags/${id}`, { enabled }, token);
}

export function deleteFeatureFlag(token: string, id: number): Promise<void> {
  return apiDelete(`/api/admin/feature-flags/${id}`, token);
}

// ── Phase 1H (Admin Portal - System Settings: Admin Announcement broadcast) ─

export type AnnouncementAudience = 'ALL' | 'STUDENT' | 'COUNSELLOR' | 'MENTOR' | 'ADMIN';

export function broadcastAnnouncement(
  token: string,
  title: string,
  body: string,
  audience: AnnouncementAudience
): Promise<{ recipientCount: number }> {
  return apiPost<{ recipientCount: number }>('/api/admin/announcements', { title, body, audience }, token);
}

// ── Phase 1H (Admin Portal - Audit Logs) ───────────────────────────────────

export interface AuditLogView {
  id: number;
  adminUserId: number;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  createdAt: string;
}

export function getAuditLogs(token: string, page = 0, size = 30): Promise<PageResponse<AuditLogView>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiGet<PageResponse<AuditLogView>>(`/api/admin/audit-logs?${params.toString()}`, token);
}

// ── Institution Management (Milestone) ──────────────────────────────────────
// Same CRUD shape as Feature Flags above. See moodmate-admin's InstitutionService/Institution.java
// for why website/logoUrl/licenseType/licenseExpiry/studentLimit exist now but aren't editable via
// any endpoint yet - future Institution Licensing & Premium Access milestone, not built today.

export type InstitutionType = 'UNIVERSITY' | 'UNIVERSITY_COLLEGE' | 'INSTITUTE';

export interface InstitutionView {
  id: number;
  name: string;
  shortName: string;
  city: string | null;
  country: string;
  type: InstitutionType;
  active: boolean;
  website: string | null;
  logoUrl: string | null;
  licenseType: string | null;
  licenseExpiry: string | null;
  studentLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionInput {
  name: string;
  shortName: string;
  city?: string;
  country: string;
  type: InstitutionType;
  website?: string;
  logoUrl?: string;
}

export function listInstitutions(token: string): Promise<InstitutionView[]> {
  return apiGet<InstitutionView[]>('/api/admin/institutions', token);
}

export function createInstitution(token: string, input: InstitutionInput): Promise<InstitutionView> {
  return apiPost<InstitutionView>('/api/admin/institutions', input, token);
}

export function updateInstitution(token: string, id: number, input: InstitutionInput): Promise<InstitutionView> {
  return apiPut<InstitutionView>(`/api/admin/institutions/${id}`, input, token);
}

export function setInstitutionActive(token: string, id: number, active: boolean): Promise<InstitutionView> {
  return apiPatch<InstitutionView>(`/api/admin/institutions/${id}/active`, { active }, token);
}

// Unauthenticated - backs the signup institution picker (see src/data/institutions/index.ts's
// loadInstitutions, which owns the live/cached/bundled fallback chain). Deliberately called with
// no token, mirroring src/api/sos.ts's public calls - /api/public/institutions has its own gateway
// route that bypasses JwtAuthFilter (see moodmate-gateway's application.yml comment).
export function fetchPublicInstitutions(): Promise<InstitutionView[]> {
  return apiGet<InstitutionView[]>('/api/public/institutions');
}
