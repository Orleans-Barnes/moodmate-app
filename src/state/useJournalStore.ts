import { create } from 'zustand';
import {
  createJournalEntry,
  listJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
} from '@/api/journal';
import type { JournalEntryView } from '@/api/types';

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  moodEmoji: string | null;
  body: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fromApi(entry: JournalEntryView): JournalEntry {
  return {
    id: String(entry.id),
    title: entry.title && entry.title.trim() ? entry.title : 'Untitled entry',
    date: formatDate(entry.createdAt),
    moodEmoji: entry.moodEmoji,
    body: entry.body,
  };
}

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  /** Data-isolation fix - see useWellnessStore.reset's doc comment for the full rationale. */
  reset: () => void;
  load: (token: string) => Promise<void>;
  addEntry: (token: string, title: string, body: string, moodEmoji?: string) => Promise<void>;
  updateEntry: (token: string, id: string, title: string, body: string) => Promise<void>;
  deleteEntry: (token: string, id: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: false,
  reset: () => set({ entries: [], loading: false }),

  load: async (token) => {
    // Guest users have no JWT — bail before hitting the real API (prevents 403). Checked before
    // setting loading:true so a guest's Journal tab doesn't get stuck on the skeleton forever (see
    // the identical fix applied to useSupportStore.load - this was the same copy-pasted bug).
    if (token === 'guest') {
      set({ entries: [], loading: false });
      return;
    }

    set({ loading: true });
    try {
      const page = await listJournalEntries(token);
      set({ entries: page.content.map(fromApi) });
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (token, title, body, moodEmoji) => {
    const created = await createJournalEntry(token, { title, body, moodEmoji });
    set({ entries: [fromApi(created), ...get().entries] });
  },

  updateEntry: async (token, id, title, body) => {
    const updated = await updateJournalEntry(token, id, { title, body });
    set({
      entries: get().entries.map((e) => (e.id === id ? fromApi(updated) : e)),
    });
  },

  deleteEntry: async (token, id) => {
    await deleteJournalEntry(token, id);
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },
}));
