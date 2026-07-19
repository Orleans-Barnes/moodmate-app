import { apiDelete, apiGet, apiPatch, apiPost } from './client';
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

// Phase 1H (Admin Portal - Peer Mentor Management) - no approve/reject queue (Phase 1G already
// established peer mentor accounts are admin-linked, not self-serve-applied-for). "Manage" here
// means the full roster (including deactivated rows) plus an activate/deactivate toggle.

export interface PeerMentorAdminView {
  id: number;
  userId: number | null;
  name: string;
  bio: string;
  avatarEmoji: string;
  focusArea: string;
  available: boolean;
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
