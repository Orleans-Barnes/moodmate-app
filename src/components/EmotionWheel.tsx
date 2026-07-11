import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { colors, fonts, fontSizes, radii } from '@/theme/tokens';

export interface Emotion {
  emoji: string;
  label: string;
  color: string;
}

export const EMOTIONS: Emotion[] = [
  { emoji: '😄', label: 'Happy', color: colors.sun },
  { emoji: '😌', label: 'Calm', color: colors.blue },
  { emoji: '🌟', label: 'Hopeful', color: colors.lavender },
  { emoji: '🙏', label: 'Grateful', color: colors.sage },
  { emoji: '💪', label: 'Motivated', color: colors.coral },
  { emoji: '😰', label: 'Anxious', color: colors.blue },
  { emoji: '😓', label: 'Stressed', color: colors.coral },
  { emoji: '😔', label: 'Lonely', color: colors.lavender },
  { emoji: '😩', label: 'Overwhelmed', color: colors.coralDeep },
  { emoji: '😤', label: 'Frustrated', color: colors.coral },
];

interface EmotionWheelProps {
  selected: Emotion | null;
  onSelect: (emotion: Emotion) => void;
  size?: number;
}

function EmotionNode({
  emotion,
  active,
  position,
  onPress,
}: {
  emotion: Emotion;
  active: boolean;
  position: { left: number; top: number };
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.node,
        { left: position.left, top: position.top },
        active && { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: emotion.color },
      ]}
    >
      <Animated.Text style={[styles.nodeEmoji, { transform: [{ scale }] }]}>
        {emotion.emoji}
      </Animated.Text>
      <Text style={styles.nodeLabel}>{emotion.label}</Text>
    </Pressable>
  );
}

export function EmotionWheel({ selected, onSelect, size = 230 }: EmotionWheelProps) {
  const radius = size * 0.38;
  const center = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]} />
      {EMOTIONS.map((emotion, i) => {
        const angle = (i / EMOTIONS.length) * 2 * Math.PI - Math.PI / 2;
        const left = center + Math.cos(angle) * radius - 26;
        const top = center + Math.sin(angle) * radius - 22;
        return (
          <EmotionNode
            key={emotion.label}
            emotion={emotion}
            active={selected?.label === emotion.label}
            position={{ left, top }}
            onPress={() => onSelect(emotion)}
          />
        );
      })}
      <View
        style={[
          styles.center,
          selected && { borderColor: selected.color },
        ]}
      >
        {selected ? (
          <Text style={styles.centerEmoji}>{selected.emoji}</Text>
        ) : (
          <Text style={styles.centerHint}>tap an{'\n'}emotion</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', marginVertical: 12 },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  node: {
    position: 'absolute',
    width: 52,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeEmoji: { fontSize: 21 },
  nodeLabel: { fontSize: 7.5, fontFamily: fonts.bodyBold, color: colors.inkSoft, marginTop: 1 },
  center: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 62,
    height: 62,
    marginLeft: -31,
    marginTop: -31,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerEmoji: { fontSize: 26 },
  centerHint: {
    fontSize: 10.5,
    fontFamily: fonts.bodyBold,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
