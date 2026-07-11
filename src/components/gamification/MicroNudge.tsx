/**
 * MicroNudge — dismissible top banner for contextual tips.
 * Slides in from top, tapping X dismisses with fade.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { fonts, fontSizes, spacing, radii } from '@/theme/tokens';

interface Props {
  message: string;
  emoji?: string;
  color?: string;
  onDismiss?: () => void;
}

export function MicroNudge({ message, emoji = '💡', color = '#5C8AE6', onDismiss }: Props) {
  const slideY  = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [gone, setGone] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideY,  { toValue: -60, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,   duration: 220, useNativeDriver: true }),
    ]).start(() => { setGone(true); onDismiss?.(); });
  };

  if (gone) return null;

  return (
    <Animated.View style={[s.wrap, { transform: [{ translateY: slideY }], opacity }]}>
      <View style={[s.bar, { borderLeftColor: color }]}>
        <Text style={s.emoji}>{emoji}</Text>
        <Text style={s.msg} numberOfLines={2}>{message}</Text>
        <Pressable style={s.close} onPress={dismiss} hitSlop={8}>
          <Text style={s.closeX}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap:  { zIndex: 100, paddingHorizontal: spacing.xl, marginBottom: 12 },
  bar:   {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: radii.sm,
    paddingVertical: 12, paddingHorizontal: 14,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  emoji: { fontSize: 20 },
  msg:   { flex: 1, fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: '#2B2530', lineHeight: 18 },
  close: { padding: 2 },
  closeX:{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#A7A1AC' },
});
