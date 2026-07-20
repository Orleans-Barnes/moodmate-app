import { create } from 'zustand';
import { createCommunityPost, deleteCommunityPost, listCommunityPosts, reactToPost } from '@/api/community';
import type { CommunityPostView, ReactionType } from '@/api/types';

export interface Reaction {
  type: ReactionType;
  emoji: string;
  count: number;
  on: boolean;
}

export interface CommunityPost {
  id: number;
  author: string;
  time: string;
  topic: string;
  text: string;
  reactions: Reaction[];
  isOwn: boolean;
}

// The backend only returns reaction types that have at least one reaction (or that the
// viewer reacted to) - see CommunityService#summarize. The frontend always renders all
// 4 buttons, so missing types here are filled in at count: 0 / on: false.
const ALL_REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'HEART', emoji: '❤️' },
  { type: 'PRAYER', emoji: '🙏' },
  { type: 'MUSCLE', emoji: '💪' },
  { type: 'PARTY', emoji: '🎉' },
];

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function fromApi(post: CommunityPostView): CommunityPost {
  const byType = new Map(post.reactions.map((r) => [r.type, r]));
  return {
    id: post.id,
    author: post.authorHandle,
    time: relativeTime(post.createdAt),
    topic: post.topic,
    text: post.content,
    isOwn: post.isOwnPost,
    reactions: ALL_REACTIONS.map(({ type, emoji }) => {
      const summary = byType.get(type);
      return { type, emoji, count: summary?.count ?? 0, on: summary?.reactedByMe ?? false };
    }),
  };
}

interface CommunityState {
  posts: CommunityPost[];
  loading: boolean;
  load: (token: string, topic?: string) => Promise<void>;
  addPost: (token: string, content: string, topic?: string) => Promise<void>;
  react: (token: string, postId: number, type: ReactionType) => Promise<void>;
  deletePost: (token: string, postId: number) => Promise<void>;
}

/**
 * Backed by the real Community API (com.moodmate.backend.community) as of Phase 3 /
 * Task #7 - Community wired next per IMPLEMENTATION_PLAN.md. Screens call load(token, topic)
 * on focus/topic-change, addPost(...) to compose, and react(...) on a reaction tap; all three
 * throw ApiRequestError on failure so the calling screen can toast it.
 */
export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  loading: false,
  load: async (token, topic) => {
    // Guest users have no JWT — bail before hitting the real API (prevents 403). Checked before
    // setting loading:true so a guest doesn't get stuck on a loading state forever.
    if (token === 'guest') return;

    set({ loading: true });
    try {
      const page = await listCommunityPosts(token, topic);
      set({ posts: page.content.map(fromApi) });
    } finally {
      set({ loading: false });
    }
  },
  addPost: async (token, content, topic) => {
    const created = await createCommunityPost(token, { content, topic });
    set({ posts: [fromApi(created), ...get().posts] });
  },
  deletePost: async (token, postId) => {
    await deleteCommunityPost(token, postId);
    set({ posts: get().posts.filter((p) => p.id !== postId) });
  },
  react: async (token, postId, type) => {
    const result = await reactToPost(token, postId, type);
    const byType = new Map(result.reactions.map((r) => [r.type, r]));
    set({
      posts: get().posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reactions: ALL_REACTIONS.map(({ type: t, emoji }) => {
                const summary = byType.get(t);
                return { type: t, emoji, count: summary?.count ?? 0, on: summary?.reactedByMe ?? false };
              }),
            }
          : post
      ),
    });
  },
}));
