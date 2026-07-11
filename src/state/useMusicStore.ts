import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { MUSIC_TRACKS, getTrack } from '@/data/musicTracks';

// ─── SecureStore adapter (same pattern as useGamificationStore) ────────────
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try { return await SecureStore.getItemAsync(name); } catch { return null; }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try { await SecureStore.setItemAsync(name, value); } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try { await SecureStore.deleteItemAsync(name); } catch {}
  },
};

// Set audio mode once — plays through iOS silent switch
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

// ─── Module-level player (survives navigation) ─────────────────────────────
// We store the AudioPlayer instance here, outside Zustand, because it can't
// be serialised. Zustand only tracks metadata (which track, playing state).
let _player: AudioPlayer | null = null;

// Sequence counter: incremented each time play() is called so we can detect
// stale callbacks and avoid two tracks running simultaneously.
let _playSeq = 0;

function _stopPlayer() {
  if (_player) {
    // pause() is synchronous and silences audio IMMEDIATELY.
    // remove() frees resources but may be async — without pause() first,
    // the old track can bleed into the new one for ~100-200ms.
    try { _player.pause(); } catch {}
    try { _player.remove(); } catch {}
    _player = null;
  }
}

// ─── State shape ──────────────────────────────────────────────────────────
interface MusicState {
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number;               // 0–1
  timerMinutes: number;         // 0 = off
  timerEndAt: number | null;    // epoch ms when timer should stop music
  favoriteIds: string[];        // persisted list of liked track IDs
}

interface MusicActions {
  play: (trackId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  playNext: () => void;
  playPrev: () => void;
  setVolume: (v: number) => void;
  setTimer: (minutes: number) => void;
  tickTimer: () => void;        // call from a 1s interval in MusicPlayerBar
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────
export const useMusicStore = create<MusicState & MusicActions>()(
  persist(
    (set, get) => ({
      currentTrackId: null,
      isPlaying: false,
      volume: 0.75,
      timerMinutes: 0,
      timerEndAt: null,
      favoriteIds: [],

      play: (trackId: string) => {
        const track = getTrack(trackId);
        if (!track) return;

        // Stop whatever is currently playing — pause() first for instant silence
        _stopPlayer();

        // Guard: capture the sequence number before the synchronous setup.
        // If play() is called again before we finish, _playSeq will have
        // advanced and this invocation will bail out, preventing a double-play.
        const seq = ++_playSeq;

        try {
          setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
          const player = createAudioPlayer(track.asset);
          player.loop = true;
          player.volume = get().volume;

          // Only commit if no newer play() call has fired in the meantime
          if (seq !== _playSeq) {
            try { player.remove(); } catch {}
            return;
          }

          player.play();
          _player = player;
          set({ currentTrackId: trackId, isPlaying: true });
        } catch {
          set({ currentTrackId: null, isPlaying: false });
        }
      },

      pause: () => {
        try { _player?.pause(); } catch {}
        set({ isPlaying: false });
      },

      resume: () => {
        try { _player?.play(); } catch {}
        set({ isPlaying: true });
      },

      stop: () => {
        _stopPlayer();
        set({ currentTrackId: null, isPlaying: false, timerMinutes: 0, timerEndAt: null });
      },

      playNext: () => {
        const { currentTrackId, play } = get();
        const idx = MUSIC_TRACKS.findIndex((t) => t.id === currentTrackId);
        const next = MUSIC_TRACKS[(idx + 1) % MUSIC_TRACKS.length];
        play(next.id);
      },

      playPrev: () => {
        const { currentTrackId, play } = get();
        const idx = MUSIC_TRACKS.findIndex((t) => t.id === currentTrackId);
        const prev = MUSIC_TRACKS[(idx - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length];
        play(prev.id);
      },

      setVolume: (v: number) => {
        const clamped = Math.max(0, Math.min(1, v));
        if (_player) {
          try { _player.volume = clamped; } catch {}
        }
        set({ volume: clamped });
      },

      setTimer: (minutes: number) => {
        if (minutes <= 0) {
          set({ timerMinutes: 0, timerEndAt: null });
        } else {
          set({
            timerMinutes: minutes,
            timerEndAt: Date.now() + minutes * 60 * 1000,
          });
        }
      },

      tickTimer: () => {
        const { timerEndAt, stop } = get();
        if (timerEndAt && Date.now() >= timerEndAt) {
          stop();
        }
      },

      toggleFavorite: (trackId: string) => {
        const { favoriteIds } = get();
        const already = favoriteIds.includes(trackId);
        set({ favoriteIds: already
          ? favoriteIds.filter((id) => id !== trackId)
          : [...favoriteIds, trackId],
        });
      },

      isFavorite: (trackId: string) => {
        return get().favoriteIds.includes(trackId);
      },
    }),
    {
      name: 'moodmate-music-store',
      storage: createJSONStorage(() => secureStorage),
      // Only persist preferences, not runtime play state
      partialize: (state) => ({
        volume: state.volume,
        currentTrackId: state.currentTrackId,
        favoriteIds: state.favoriteIds,
      }),
      // Always start paused on app launch (player doesn't survive restart)
      onRehydrateStorage: () => () => {
        useMusicStore.setState({ isPlaying: false, timerMinutes: 0, timerEndAt: null });
      },
    }
  )
);
