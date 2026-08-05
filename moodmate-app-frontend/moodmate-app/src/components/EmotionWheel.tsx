import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, calm, accents } from '@/theme/tokens';

export interface Emotion {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

// Matches backend Emotion.java exactly (see api/types.ts's EmotionKey) — same 10 labels,
// uppercased, no extra mapping table needed. Each emotion draws its color from the shared
// semantic accent table (tokens.ts) rather than a one-off hex, so the wheel stays visually
// distinct per-emotion while still pulling from the app's curated content palette.
export const EMOTIONS: Emotion[] = [
  { icon: 'happy-outline',        label: 'Happy',      color: accents.focus.accent },
  { icon: 'leaf-outline',         label: 'Calm',       color: accents.calm.accent },
  { icon: 'sunny-outline',        label: 'Hopeful',    color: accents.wellness.accent },
  { icon: 'heart-outline',        label: 'Grateful',   color: accents.gratitude.accent },
  { icon: 'flash-outline',        label: 'Motivated',  color: accents.energy.accent },
  { icon: 'alert-circle-outline', label: 'Anxious',    color: accents.anxiety.accent },
  { icon: 'warning-outline',      label: 'Stressed',   color: accents.creativity.accent },
  { icon: 'person-outline',       label: 'Lonely',     color: accents.sleep.accent },
  { icon: 'cloud-outline',        label: 'Overwhelmed',color: accents.learning.accent },
  { icon: 'thunderstorm-outline', label: 'Frustrated', color: accents.social.accent },
];

interface EmotionWheelProps {
  /** Multi-select — Figma's "Name the feeling" step lets you tap all that fit. */
  selected: Emotion[];
  onToggle: (emotion: Emotion) => void;
  size?: number;
}

function EmotionNode({
  emotion, active, position, onPress,
}: {
  emotion: Emotion; active: boolean; position: { left: number; top: number }; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.2, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={emotion.label}
      accessibilityState={{ selected: active }}
      style={[
        styles.node,
        position,
        active ? { backgroundColor: emotion.color } : styles.nodeInactive,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={emotion.icon}
          size={18}
          color={active ? '#FFFFFF' : emotion.color}
        />
      </Animated.View>
      <Text style={[styles.nodeLabel, active && styles.nodeLabelActive]}>{emotion.label}</Text>
    </Pressable>
  );
}

export function EmotionWheel({ selected, onToggle, size = 300 }: EmotionWheelProps) {
  const radius = size * 0.38;
  const center = size / 2;
  const isSelected = (e: Emotion) => selected.some((s) => s.label === e.label);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]} />
      {EMOTIONS.map((emotion, i) => {
        const angle = (i / EMOTIONS.length) * 2 * Math.PI - Math.PI / 2;
        const left = center + Math.cos(angle) * radius - 30;
        const top = center + Math.sin(angle) * radius - 24;
        return (
          <EmotionNode
            key={emotion.label}
            emotion={emotion}
            active={isSelected(emotion)}
            position={{ left, top }}
            onPress={() => onToggle(emotion)}
          />
        );
      })}
      <View style={styles.center}>
        <Text style={styles.centerCount}>{selected.length}</Text>
        <Text style={styles.centerLabel}>selected</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  ring: { position: 'absolute', backgroundColor: calm.mintBg },
  node: {
    position: 'absolute',
    width: 60, height: 48,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeInactive: { backgroundColor: 'transparent' },
  nodeLabel: { fontSize: 10.5, fontFamily: fonts.bodyMedium, color: calm.forest, marginTop: 1 },
  nodeLabelActive: { color: '#FFFFFF', fontFamily: fonts.bodyBold },
  center: {
    position: 'absolute',
    left: '50%', top: '50%',
    width: 96, height: 96,
    marginLeft: -48, marginTop: -48,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  centerCount: { fontSize: 18, fontFamily: fonts.displayExtraBold, color: calm.forest },
  centerLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: calm.forest },
});
