import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AcademyState {
  completedLessons: string[];
  assessmentScore: number | null;
  certificateId: string | null;
  completeLesson: (lessonId: string) => void;
  submitAssessment: (score: number) => void;
  resetProgress: () => void;
}

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set) => ({
      completedLessons: [],
      assessmentScore: null,
      certificateId: null,
      completeLesson: (lessonId) => set((state) => ({
        completedLessons: state.completedLessons.includes(lessonId)
          ? state.completedLessons
          : [...state.completedLessons, lessonId],
      })),
      submitAssessment: (score) => set({
        assessmentScore: score,
        certificateId: score >= 80 ? `MM-PM-${Date.now().toString(36).toUpperCase()}` : null,
      }),
      resetProgress: () => set({ completedLessons: [], assessmentScore: null, certificateId: null }),
    }),
    {
      name: 'moodmate_peer_mentor_academy',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
