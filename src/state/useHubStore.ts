import { create } from 'zustand';
import { cancelRsvp, listArticles, listEvents, rsvpToEvent } from '@/api/hub';
import type { ArticleView, EventView } from '@/api/types';

export interface Article {
  id: number;
  tag: string;
  title: string;
  summary: string;
  body: string;
  readTime: string;
  imageEmoji: string;
}

export interface EventItem {
  id: number;
  day: string;
  month: string;
  name: string;
  description: string;
  location: string;
  time: string;
  going: number;
  capacity: number | null;
  rsvped: boolean;
}

function categoryLabel(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

function fromArticle(a: ArticleView): Article {
  return {
    id: a.id,
    tag: categoryLabel(a.category),
    title: a.title,
    summary: a.summary,
    body: a.body,
    readTime: `${a.readMinutes} min read`,
    imageEmoji: a.imageEmoji,
  };
}

function fromEvent(e: EventView): EventItem {
  const d = new Date(e.startsAt);
  return {
    id: e.id,
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    name: e.title,
    description: e.description,
    location: e.location,
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    going: e.goingCount,
    capacity: e.capacity,
    rsvped: e.rsvped,
  };
}

interface HubState {
  articles: Article[];
  events: EventItem[];
  loading: boolean;
  load: (token: string) => Promise<void>;
  toggleRsvp: (token: string, id: number) => Promise<void>;
}

/**
 * Backed by the real Hub API (com.moodmate.backend.hub) - Phase 3/Task #7, Explore wiring.
 * Articles have no "featured" concept server-side (ArticleResponse has no such field), so
 * unlike the old mock data, every article renders the same way.
 */
export const useHubStore = create<HubState>((set, get) => ({
  articles: [],
  events: [],
  loading: false,
  load: async (token) => {
    set({ loading: true });
    // Guest users have no JWT — bail before hitting the real API (prevents 403)
    if (token === 'guest') return;

    try {
      const [articlesPage, eventsPage] = await Promise.all([listArticles(token), listEvents(token)]);
      set({
        articles: articlesPage.content.map(fromArticle),
        events: eventsPage.content.map(fromEvent),
      });
    } finally {
      set({ loading: false });
    }
  },
  toggleRsvp: async (token, id) => {
    const current = get().events.find((e) => e.id === id);
    if (!current) return;
    const updated = current.rsvped ? await cancelRsvp(token, id) : await rsvpToEvent(token, id);
    set({ events: get().events.map((e) => (e.id === id ? fromEvent(updated) : e)) });
  },
}));
