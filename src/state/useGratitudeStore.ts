import { create } from 'zustand';
import { createGratitudeEntry, listGratitudeEntries, deleteGratitudeEntry } from '@/api/gratitude';
import type { GratitudeEntryView } from '@/api/types';

export interface GratitudeNote {
  id: number;
  text: string;
  date: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fromApi(entry: GratitudeEntryView): GratitudeNote {
  return { id: entry.id, text: entry.content, date: formatDate(entry.createdAt) };
}

interface GratitudeState {
  notes: GratitudeNote[];
  loading: boolean;
  load: (token: string) => Promise<void>;
  addNote: (token: string, content: string) => Promise<void>;
  deleteNote: (token: string, id: number) => Promise<void>;
}

export const useGratitudeStore = create<GratitudeState>((set, get) => ({
  notes: [],
  loading: false,

  load: async (token) => {
    // Guest users have no JWT — bail before hitting the real API (prevents 403). Checked before
    // setting loading:true so a guest doesn't get stuck on a loading state forever.
    if (token === 'guest') return;

    set({ loading: true });
    try {
      const page = await listGratitudeEntries(token);
      set({ notes: page.content.map(fromApi) });
    } finally {
      set({ loading: false });
    }
  },

  addNote: async (token, content) => {
    const created = await createGratitudeEntry(token, { content });
    set({ notes: [fromApi(created), ...get().notes] });
  },

  deleteNote: async (token, id) => {
    await deleteGratitudeEntry(token, id);
    set({ notes: get().notes.filter((n) => n.id !== id) });
  },
}));
