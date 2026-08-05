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
import { radii, glass } from '@/theme/tokens';

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
  variant?: 'light' | 'dark' | 'solid' | 'clear';
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
  variant,
  overlayColor = glass.lightFill,
  borderColor = glass.lightBorder,
  borderRadius = radii.xl,
  style,
  children,
}: GlassViewProps) {
  const resolvedTint = variant === 'dark' ? 'dark' : tint;
  const resolvedOverlay =
    variant === 'dark'
      ? glass.darkFill
      : variant === 'solid'
        ? glass.solidFill
        : variant === 'clear'
          ? 'transparent'
          : overlayColor;
  const resolvedBorder =
    variant === 'dark'
      ? glass.darkBorder
      : variant === 'solid'
        ? glass.solidBorder
        : variant === 'clear'
          ? 'transparent'
          : borderColor;
  const baseStyle: ViewStyle = {
    borderRadius,
    borderWidth: resolvedBorder === 'transparent' ? 0 : 1,
    borderColor: resolvedBorder,
    overflow: 'hidden',
  };

  if (BlurView && variant !== 'solid' && variant !== 'clear') {
    // Real frosted glass ✨
    return (
      <BlurView intensity={intensity} tint={resolvedTint} style={[baseStyle, style]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: resolvedOverlay }]} />
        {children}
      </BlurView>
    );
  }

  // Fallback — rich semi-transparent fill (looks good, not blurred)
  return (
    <View style={[baseStyle, { backgroundColor: resolvedOverlay }, style]}>
      {children}
    </View>
  );
}

/**
 * DarkGlassView — for use on dark/gradient backgrounds (auth screens, headers)
 */
export function DarkGlassView({
  intensity = 40,
  overlayColor = glass.darkFill,
  borderColor = glass.darkBorder,
  borderRadius = radii.lg,
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
