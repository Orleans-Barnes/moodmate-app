/**
 * GlassView — Real frosted glass component
 *
 * Uses expo-blur's BlurView for genuine backdrop blur.
 * Falls back to semi-transparent overlay if expo-blur not yet installed.
 *
 * Install: npx expo install expo-blur
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

// Dynamic require so TypeScript doesn't error before expo-blur is installed.
// Once you run `npx expo install expo-blur`, this will activate automatically.
let BlurView: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BlurView = require('expo-blur').BlurView;
} catch (_) {}

interface GlassViewProps {
  /** Blur strength 0-100. Default 55. */
  intensity?: number;
  /** 'light' | 'dark' | 'default'. Default 'light'. */
  tint?: 'light' | 'dark' | 'default';
  /** Fill colour on top of blur. */
  overlayColor?: string;
  /** Border colour. */
  borderColor?: string;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export function GlassView({
  intensity = 55,
  tint = 'light',
  overlayColor = 'rgba(255,255,255,0.14)',
  borderColor = 'rgba(255,255,255,0.22)',
  borderRadius = 18,
  style,
  children,
}: GlassViewProps) {
  const baseStyle: ViewStyle = {
    borderRadius,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
  };

  if (BlurView) {
    // Real frosted glass ✨
    return (
      <BlurView intensity={intensity} tint={tint} style={[baseStyle, style]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
        {children}
      </BlurView>
    );
  }

  // Fallback — rich semi-transparent fill (looks good, not blurred)
  return (
    <View style={[baseStyle, { backgroundColor: overlayColor }, style]}>
      {children}
    </View>
  );
}

/**
 * DarkGlassView — for use on dark/gradient backgrounds (auth screens, headers)
 */
export function DarkGlassView({
  intensity = 40,
  overlayColor = 'rgba(255,255,255,0.09)',
  borderColor = 'rgba(255,255,255,0.18)',
  borderRadius = 16,
  style,
  children,
}: Omit<GlassViewProps, 'tint'>) {
  return (
    <GlassView
      intensity={intensity}
      tint="dark"
      overlayColor={overlayColor}
      borderColor={borderColor}
      borderRadius={borderRadius}
      style={style}
    >
      {children}
    </GlassView>
  );
}
