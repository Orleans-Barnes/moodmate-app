import { create } from 'zustand';

interface ToastState {
  message: string | null;
  /** increments on every show() call so the host can re-trigger its animation even for repeated messages */
  token: number;
  show: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  token: 0,
  show: (message) => set((s) => ({ message, token: s.token + 1 })),
}));

/** Convenience hook for screens: const toast = useToast(); toast('Saved!'); */
export function useToast() {
  return useToastStore((s) => s.show);
}
