import { create } from 'zustand';
import {
  bookAppointment,
  cancelAppointment,
  listAppointments,
  listConversations,
  listCounsellors,
  listMentors,
  listMyMentorRequests,
  requestMentor as apiRequestMentor,
  rescheduleAppointment,
  startConversation,
  submitCounsellorRating,
} from '@/api/support';
import type {
  AppointmentView,
  ConversationView,
  CounsellorView,
  MentorRequestView,
  MentorView,
} from '@/api/types';
import type { CounsellorRatingResponse } from '@/api/support';

interface SupportState {
  counsellors: CounsellorView[];
  mentors: MentorView[];
  appointments: AppointmentView[];
  conversations: ConversationView[];
  // Phase 1G - the logged-in student's own mentor requests, keyed by peerMentorId in the UI (see
  // SupportScreen.tsx) to decide whether a mentor card shows "Request", "Request sent", or
  // "Message".
  myMentorRequests: MentorRequestView[];
  loading: boolean;
  load: (token: string) => Promise<void>;
  book: (token: string, counsellorId: number, scheduledAt: string, notes?: string) => Promise<AppointmentView>;
  cancel: (token: string, appointmentId: number) => Promise<void>;
  /** Phase 1F-A - student-initiated reschedule of an existing appointment. */
  reschedule: (token: string, appointmentId: number, scheduledAt: string) => Promise<AppointmentView>;
  /** Fix #5 - rates a COMPLETED appointment. The backend response is the rating itself, not the
   * appointment, so this locally flips that appointment's `rated` flag to true on success. */
  rateAppointment: (
    token: string,
    appointmentId: number,
    stars: number,
    comment?: string
  ) => Promise<CounsellorRatingResponse>;
  /** Phase 1G - sends a new mentor request; does not create a conversation (that happens once the
   * mentor accepts). */
  requestMentor: (token: string, peerMentorId: number, message?: string) => Promise<MentorRequestView>;
  /** Reuses an existing conversation with this counsellor/mentor if one exists, otherwise starts one. */
  openConversation: (
    token: string,
    target: { counsellorId?: number; peerMentorId?: number }
  ) => Promise<ConversationView>;
}

/**
 * Backed by the real Support API (com.moodmate.backend.support) - Phase 3/Task #7. A Counsellor
 * can be booked AND messaged; a PeerMentor can only be messaged - there is no booking endpoint
 * for mentors on the backend, so this store never exposes one either.
 */
export const useSupportStore = create<SupportState>((set, get) => ({
  counsellors: [],
  mentors: [],
  appointments: [],
  conversations: [],
  myMentorRequests: [],
  loading: false,
  load: async (token) => {
    // Guest users have no JWT — bail before hitting the real API (prevents 403). Checked before
    // setting loading:true so a guest's Support tab doesn't get stuck on the skeleton forever with
    // no way to clear it (the old code set loading:true then returned before the finally block
    // that resets it).
    if (token === 'guest') return;

    set({ loading: true });
    try {
      const [counsellors, mentors, appointments, conversations, myMentorRequests] = await Promise.all([
        listCounsellors(token),
        listMentors(token),
        listAppointments(token),
        listConversations(token),
        listMyMentorRequests(token),
      ]);
      set({ counsellors, mentors, appointments, conversations, myMentorRequests });
    } finally {
      set({ loading: false });
    }
  },
  book: async (token, counsellorId, scheduledAt, notes) => {
    const appointment = await bookAppointment(token, { counsellorId, scheduledAt, notes });
    set({ appointments: [appointment, ...get().appointments] });
    return appointment;
  },
  cancel: async (token, appointmentId) => {
    const updated = await cancelAppointment(token, appointmentId);
    set({ appointments: get().appointments.map((a) => (a.id === appointmentId ? updated : a)) });
  },
  reschedule: async (token, appointmentId, scheduledAt) => {
    const updated = await rescheduleAppointment(token, appointmentId, scheduledAt);
    set({ appointments: get().appointments.map((a) => (a.id === appointmentId ? updated : a)) });
    return updated;
  },
  rateAppointment: async (token, appointmentId, stars, comment) => {
    const rating = await submitCounsellorRating(token, appointmentId, stars, comment);
    set({
      appointments: get().appointments.map((a) => (a.id === appointmentId ? { ...a, rated: true } : a)),
    });
    return rating;
  },
  requestMentor: async (token, peerMentorId, message) => {
    const created = await apiRequestMentor(token, { peerMentorId, message });
    set({ myMentorRequests: [created, ...get().myMentorRequests] });
    return created;
  },
  openConversation: async (token, target) => {
    const existing = get().conversations.find((c) =>
      target.counsellorId ? c.counsellorId === target.counsellorId : c.peerMentorId === target.peerMentorId
    );
    if (existing) return existing;
    const created = await startConversation(token, target);
    set({ conversations: [created, ...get().conversations] });
    return created;
  },
}));
