import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolveIcon, type IonName } from '@/theme/iconMap';

interface AppIconProps {
  /** Icon key, legacy emoji, or raw Ionicons name */
  name: string | null | undefined;
  size?: number;
  color?: string;
  fallback?: IonName;
  style?: StyleProp<ViewStyle>;
  /** Tinted circular background */
  bg?: string;
  bgSize?: number;
}

/** Renders @expo/vector-icons Ionicons from a semantic key or legacy emoji. */
export function AppIcon({
  name,
  size = 22,
  color = '#2B2530',
  fallback = 'ellipse-outline',
  style,
  bg,
  bgSize,
}: AppIconProps) {
  const ion = resolveIcon(name, fallback);
  const wrap = bgSize ?? size + 14;

  if (bg) {
    return (
      <View style={[s.circle, { width: wrap, height: wrap, borderRadius: wrap / 2, backgroundColor: bg }, style]}>
        <Ionicons name={ion} size={size} color={color} />
      </View>
    );
  }

  return (
    <View style={style}>
      <Ionicons name={ion} size={size} color={color} />
    </View>
  );
}

const s = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
