/**
 * LiquidBackground — organic, slowly morphing blobs that give screens
 * a living, fluid feel without any heavy SVG library.
 *
 * Each blob is a circle that independently oscillates in X, Y, and scale
 * with slightly different periods so they never repeat the same pattern.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

interface BlobProps {
  x: number; y: number; size: number;
  color: string; opacity: number;
  durX: number; durY: number; durS: number;
  delay: number;
  dx: number; dy: number;
}

function Blob({ x, y, size, color, opacity, durX, durY, durS, delay, dx, dy }: BlobProps) {
  const tx    = useRef(new Animated.Value(0)).current;
  const ty    = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(tx, { toValue:  dx, duration: durX, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(tx, { toValue: -dx, duration: durX,        easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(ty, { toValue: -dy, duration: durY, delay: delay + 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(ty, { toValue:  dy, duration: durY,                     easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.18, duration: durS, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.85, duration: durS,        easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top:  y - size / 2,
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      }}
    />
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type LiquidPreset = 'wellness' | 'focus' | 'sleep' | 'energy' | 'auth';

const PRESETS: Record<LiquidPreset, { blobs: Omit<BlobProps, 'durX'|'durY'|'durS'|'delay'>[] }> = {
  wellness: { blobs: [
    { x: W * 0.05, y: H * 0.08, size: 260, color: '#C4B5FD', opacity: 0.18, dx: 28, dy: 36 },
    { x: W * 0.88, y: H * 0.13, size: 200, color: '#FCA5A5', opacity: 0.16, dx: 22, dy: 30 },
    { x: W * 0.5,  y: H * 0.32, size: 180, color: '#86EFAC', opacity: 0.14, dx: 38, dy: 28 },
    { x: W * 0.1,  y: H * 0.60, size: 220, color: '#93C5FD', opacity: 0.15, dx: 26, dy: 32 },
    { x: W * 0.80, y: H * 0.68, size: 170, color: '#FDE68A', opacity: 0.15, dx: 32, dy: 38 },
    { x: W * 0.45, y: H * 0.88, size: 190, color: '#F0ABFC', opacity: 0.13, dx: 20, dy: 24 },
  ]},
  focus: { blobs: [
    { x: W * 0.08, y: H * 0.10, size: 240, color: '#818CF8', opacity: 0.18, dx: 25, dy: 32 },
    { x: W * 0.85, y: H * 0.15, size: 190, color: '#38BDF8', opacity: 0.15, dx: 20, dy: 28 },
    { x: W * 0.45, y: H * 0.40, size: 160, color: '#34D399', opacity: 0.14, dx: 35, dy: 24 },
    { x: W * 0.12, y: H * 0.65, size: 210, color: '#A78BFA', opacity: 0.16, dx: 28, dy: 30 },
    { x: W * 0.78, y: H * 0.72, size: 175, color: '#60A5FA', opacity: 0.14, dx: 30, dy: 35 },
  ]},
  sleep: { blobs: [
    { x: W * 0.06, y: H * 0.08, size: 260, color: '#6366F1', opacity: 0.16, dx: 20, dy: 28 },
    { x: W * 0.82, y: H * 0.12, size: 200, color: '#8B5CF6', opacity: 0.14, dx: 18, dy: 24 },
    { x: W * 0.5,  y: H * 0.35, size: 170, color: '#312E81', opacity: 0.20, dx: 30, dy: 22 },
    { x: W * 0.14, y: H * 0.62, size: 220, color: '#4F46E5', opacity: 0.15, dx: 24, dy: 30 },
    { x: W * 0.76, y: H * 0.70, size: 180, color: '#7C3AED', opacity: 0.14, dx: 26, dy: 32 },
  ]},
  energy: { blobs: [
    { x: W * 0.05, y: H * 0.08, size: 250, color: '#FB923C', opacity: 0.18, dx: 32, dy: 40 },
    { x: W * 0.85, y: H * 0.14, size: 190, color: '#FBBF24', opacity: 0.16, dx: 26, dy: 32 },
    { x: W * 0.48, y: H * 0.38, size: 170, color: '#F472B6', opacity: 0.15, dx: 38, dy: 26 },
    { x: W * 0.12, y: H * 0.63, size: 215, color: '#EF4444', opacity: 0.14, dx: 28, dy: 34 },
    { x: W * 0.78, y: H * 0.72, size: 175, color: '#FBBF24', opacity: 0.15, dx: 30, dy: 38 },
  ]},
  auth: { blobs: [
    { x: W * 0.05, y: H * 0.06, size: 280, color: '#C4B5FD', opacity: 0.22, dx: 30, dy: 42 },
    { x: W * 0.88, y: H * 0.10, size: 210, color: '#FCA5A5', opacity: 0.20, dx: 24, dy: 34 },
    { x: W * 0.50, y: H * 0.30, size: 190, color: '#86EFAC', opacity: 0.18, dx: 42, dy: 30 },
    { x: W * 0.08, y: H * 0.58, size: 240, color: '#93C5FD', opacity: 0.19, dx: 28, dy: 36 },
    { x: W * 0.82, y: H * 0.66, size: 185, color: '#FDE68A', opacity: 0.18, dx: 36, dy: 42 },
    { x: W * 0.44, y: H * 0.86, size: 200, color: '#F0ABFC', opacity: 0.17, dx: 22, dy: 28 },
  ]},
};

// Stagger seed ensures blobs don't all move in sync
const STAGGER_SEEDS = [0, 800, 1400, 300, 1100, 600];
const DUR_SEEDS_X   = [7200, 8600, 6400, 9100, 7800, 8300];
const DUR_SEEDS_Y   = [9400, 7100, 8800, 6600, 10200, 7500];
const DUR_SEEDS_S   = [5800, 7300, 6100, 8400, 6900, 7800];

interface LiquidBackgroundProps {
  preset?: LiquidPreset;
  /** Override blob colors completely */
  colors?: string[];
  /** Extra opacity multiplier (default 1) */
  opacityScale?: number;
}

export function LiquidBackground({ preset = 'wellness', colors: overrideColors, opacityScale = 1 }: LiquidBackgroundProps) {
  const { blobs } = PRESETS[preset];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {blobs.map((b, i) => (
        <Blob
          key={i}
          {...b}
          color={overrideColors ? overrideColors[i % overrideColors.length] : b.color}
          opacity={b.opacity * opacityScale}
          durX={DUR_SEEDS_X[i]}
          durY={DUR_SEEDS_Y[i]}
          durS={DUR_SEEDS_S[i]}
          delay={STAGGER_SEEDS[i]}
        />
      ))}
    </View>
  );
}
