import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useToastStore } from '@/state/useToast';
import { colors, fonts, fontSizes, radii, spacing } from '@/theme/tokens';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';

const VISIBLE_MS = 2300;

/** Mount once near the root of the app (see App.tsx). */
export function ToastHost() {
  const { message, token } = useToastStore();
  const { isDark } = useResolvedAppearance();
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 14, duration: 300, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }, VISIBLE_MS);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!visible || !message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, isDark && styles.toastDark, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={[styles.text, isDark && styles.textDark]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: 92,
    backgroundColor: colors.ink,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  toastDark: {
    backgroundColor: '#F2F7F3',
    shadowColor: '#000000',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  textDark: { color: colors.ink },
});
