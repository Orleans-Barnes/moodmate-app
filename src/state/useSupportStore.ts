import { create } from 'zustand';
import {
  bookAppointment,
  cancelAppointment,
  listAppointments,
  listConversations,
  listCounsellors,
  listMentors,
  startConversation,
} from '@/api/support';
import type { AppointmentView, ConversationView, CounsellorView, MentorView } from '@/api/types';

interface SupportState {
  counsellors: CounsellorView[];
  mentors: MentorView[];
  appointments: AppointmentView[];
  conversations: ConversationView[];
  loading: boolean;
  load: (token: string) => Promise<void>;
  book: (token: string, counsellorId: number, scheduledAt: string, notes?: string) => Promise<AppointmentView>;
  cancel: (token: string, appointmentId: number) => Promise<void>;
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
  loading: false,
  load: async (token) => {
    set({ loading: true });
    // Guest users have no JWT — bail before hitting the real API (prevents 403)
    if (token === 'guest') return;

    try {
      const [counsellors, mentors, appointments, conversations] = await Promise.all([
        listCounsellors(token),
        listMentors(token),
        listAppointments(token),
        listConversations(token),
      ]);
      set({ counsellors, mentors, appointments, conversations });
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
