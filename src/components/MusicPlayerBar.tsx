/**
 * MusicPlayerBar — floating mini-player above the tab bar.
 * Spotify-grade design: glass pill, Ionicons controls, color-matched album tile,
 * live waveform visualiser, smooth slide-in/out spring animation.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticHeavy, hapticWarning } from '@/utils/haptics';
import * as Haptics from 'expo-haptics';
import { useMusicStore } from '@/state/useMusicStore';
import { getTrack } from '@/data/musicTracks';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { fonts, fontSizes } from '@/theme/tokens';

const TAB_BAR_H      = Platform.OS === 'ios' ? 84 : 64;
const TAB_BAR_MARGIN = 28;

// Derive a contrasting icon color from the track color
function iconColor(hex: string): string {
  // Always white on these dark cards
  return '#FFFFFF';
}

export function MusicPlayerBar() {
  const insets = useSafeAreaInsets();
  const {
    currentTrackId, isPlaying, timerEndAt,
    pause, resume, stop, playNext, playPrev, tickTimer, toggleFavorite, isFavorite,
  } = useMusicStore();
  const track = currentTrackId ? getTrack(currentTrackId) : null;

  // ── Slide animation ────────────────────────────────────────────────────────
  const slideY   = useRef(new Animated.Value(100)).current;
  const prevId   = useRef<string | null>(null);
  const scaleBtn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentTrackId && !prevId.current) {
      Animated.spring(slideY, {
        toValue: 0, tension: 70, friction: 11, useNativeDriver: true,
      }).start();
    } else if (!currentTrackId && prevId.current) {
      Animated.timing(slideY, { toValue: 100, duration: 260, useNativeDriver: true }).start();
    }
    prevId.current = currentTrackId;
  }, [currentTrackId]);

  // Pulse play button on track start
  useEffect(() => {
    if (!currentTrackId) return;
    Animated.sequence([
      Animated.timing(scaleBtn, { toValue: 1.18, duration: 120, useNativeDriver: true }),
      Animated.spring(scaleBtn, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [currentTrackId]);

  // ── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerEndAt) return;
    const id = setInterval(tickTimer, 1000);
    return () => clearInterval(id);
  }, [timerEndAt]);

  const [timerDisplay, setTimerDisplay] = useState('');
  useEffect(() => {
    if (!timerEndAt) { setTimerDisplay(''); return; }
    const update = () => {
      const ms = timerEndAt - Date.now();
      if (ms <= 0) { setTimerDisplay(''); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimerDisplay(`${m}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timerEndAt]);

  if (!track) return null;

  const bottomOffset = insets.bottom + TAB_BAR_MARGIN + TAB_BAR_H + 8;
  const c = track.color;

  return (
    <Animated.View
      style={[s.wrap, { bottom: bottomOffset, transform: [{ translateY: slideY }] }]}
      pointerEvents="box-none"
    >
      {/* Glow halo */}
      <View style={[s.glow, { backgroundColor: c + '28' }]} />

      {/* Glass pill */}
      <View style={s.pill}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[s.pillInner, { borderColor: c + '30' }]}>

          {/* ── Album tile ─────────────────────────────────────────────────── */}
          <LinearGradient
            colors={[c, c + '88']}
            style={s.albumTile}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={
                track.genre.includes('Sleep') ? 'moon' :
                track.genre.includes('Focus') || track.genre.includes('ADHD') ? 'bulb' :
                track.genre.includes('Meditat') ? 'infinite' :
                track.genre.includes('Noise') ? 'radio' :
                track.genre.includes('Nature') || track.genre.includes('Rain') ? 'leaf' :
                track.genre.includes('Morning') ? 'sunny' :
                'musical-notes'
              }
              size={18}
              color="#fff"
            />
          </LinearGradient>

          {/* ── Track info ─────────────────────────────────────────────────── */}
          <View style={s.info}>
            <Text style={s.trackName} numberOfLines={1}>{track.name}</Text>
            <View style={s.genreRow}>
              <WaveformVisualizer isPlaying={isPlaying} color={c} barCount={5} height={13} />
              {timerDisplay ? (
                <Text style={[s.timer, { color: c }]}>{timerDisplay}</Text>
              ) : (
                <Text style={s.genre} numberOfLines={1}>{track.genre}</Text>
              )}
            </View>
          </View>

          {/* ── Controls ───────────────────────────────────────────────────── */}
          <View style={s.controls}>
            {/* Prev */}
            <Pressable
              style={s.iconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                playPrev();
              }}
              hitSlop={10}
            >
              <Ionicons name="play-skip-back" size={18} color="rgba(255,255,255,0.65)" />
            </Pressable>

            {/* Play / Pause — accent pill */}
            <Animated.View style={{ transform: [{ scale: scaleBtn }] }}>
              <Pressable
                style={[s.playBtn, { backgroundColor: c }]}
                onPress={() => { hapticHeavy(); isPlaying ? pause() : resume(); }}
                hitSlop={4}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={17}
                  color="#fff"
                  style={isPlaying ? undefined : { marginLeft: 2 }}
                />
              </Pressable>
            </Animated.View>

            {/* Next */}
            <Pressable
              style={s.iconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                playNext();
              }}
              hitSlop={10}
            >
              <Ionicons name="play-skip-forward" size={18} color="rgba(255,255,255,0.65)" />
            </Pressable>

            {/* Favorite */}
            {currentTrackId && (
              <Pressable
                style={s.iconBtn}
                onPress={() => { hapticHeavy(); toggleFavorite(currentTrackId); }}
                hitSlop={10}
              >
                <Ionicons
                  name={isFavorite(currentTrackId) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite(currentTrackId) ? '#F43F5E' : 'rgba(255,255,255,0.45)'}
                />
              </Pressable>
            )}

            {/* Stop */}
            <Pressable
              style={s.iconBtn}
              onPress={() => { hapticWarning(); stop(); }}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.35)" />
            </Pressable>
          </View>

        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    left: 10, right: 10, top: 4, bottom: -4,
    borderRadius: 22,
    // Shadow cast by glow on Android via elevation; iOS uses shadow*
  },
  pill: {
    borderRadius: 20,
    overflow: 'hidden',
    // Outer shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 18,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(18,18,30,0.72)',
  },

  albumTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  trackName: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genre: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.42)',
    flex: 1,
  },
  timer: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    minWidth: 34,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
});
