import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CaseStatus = 'SUBMITTED' | 'IN_REVIEW' | 'FEEDBACK_READY';

export interface CollaborationCase {
  id: string;
  studentName: string;
  concern: string;
  urgency: 'ROUTINE' | 'PRIORITY' | 'URGENT';
  createdAt: string;
  status: CaseStatus;
  feedback: string | null;
}

interface CollaborationState {
  cases: CollaborationCase[];
  submitCase: (input: Pick<CollaborationCase, 'studentName' | 'concern' | 'urgency'>) => void;
  markInReview: (id: string) => void;
  addFeedback: (id: string, feedback: string) => void;
}

export const useCollaborationStore = create<CollaborationState>()(
  persist(
    (set) => ({
      cases: [],
      submitCase: (input) => set((state) => ({
        cases: [{ ...input, id: `case-${Date.now()}`, createdAt: new Date().toISOString(), status: 'SUBMITTED', feedback: null }, ...state.cases],
      })),
      markInReview: (id) => set((state) => ({ cases: state.cases.map((item) => item.id === id ? { ...item, status: 'IN_REVIEW' } : item) })),
      addFeedback: (id, feedback) => set((state) => ({ cases: state.cases.map((item) => item.id === id ? { ...item, status: 'FEEDBACK_READY', feedback } : item) })),
    }),
    { name: 'moodmate-counsellor-collaboration', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
