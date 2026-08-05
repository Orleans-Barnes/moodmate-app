/**
 * CelebrationModal — shared "blurred backdrop + spring-in gradient card +
 * dismiss" shape, extracted from what used to be three independent
 * implementations (LevelUpModal, StreakBumpCard, SaveProgressModal). Each
 * caller supplies its own gradient/icon/copy; the entrance animation,
 * backdrop, card shape, and typography are unified here.
 *
 * Usage:
 *   const ref = useRef<CelebrationModalHandle>(null);
 *   ref.current?.show();
 *   <CelebrationModal ref={ref} gradientColors={gradients.lavender} title="Level 4" ... />
 */
import React, { forwardRef, ReactNode, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing, shadow, typography, glass, colors } from '@/theme/tokens';

const { width: SW } = Dimensions.get('window');

export interface CelebrationModalHandle {
  show: () => void;
  hide: () => void;
}

interface CelebrationModalProps {
  gradientColors: readonly [string, string, ...string[]];
  icon?: ReactNode;
  /** Small uppercase label above the title, e.g. "LEVEL UP!" or "STREAK!" */
  eyebrow?: string;
  title: string;
  message?: string;
  dismissLabel?: string;
  onDismiss?: () => void;
}

export const CelebrationModal = forwardRef<CelebrationModalHandle, CelebrationModalProps>(
  ({ gradientColors, icon, eyebrow, title, message, dismissLabel = 'Nice!', onDismiss }, ref) => {
    const [visible, setVisible] = useState(false);
    const cardScale = useRef(new Animated.Value(0.6)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      show() {
        setVisible(true);
        cardScale.setValue(0.6);
        cardOpacity.setValue(0);
        Animated.parallel([
          Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
      },
      hide() {
        setVisible(false);
      },
    }));

    const dismiss = () => {
      setVisible(false);
      onDismiss?.();
    };

    if (!visible) return null;

    return (
      <Modal transparent animationType="fade" visible={visible} onRequestClose={dismiss}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={dismiss}>
            <Pressable onPress={() => {}}>
              <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradient}
                >
                  {icon && <View style={styles.iconWrap}>{icon}</View>}
                  {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                  <Text style={styles.title}>{title}</Text>
                  {message ? <Text style={styles.message}>{message}</Text> : null}
                  <Pressable style={styles.btn} onPress={dismiss}>
                    <Text style={styles.btnTxt}>{dismissLabel}</Text>
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </Pressable>
        </BlurView>
      </Modal>
    );
  },
);

CelebrationModal.displayName = 'CelebrationModal';

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: SW - spacing.huge,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  gradient: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xxl,
  },
  iconWrap: { marginBottom: spacing.lg },
  eyebrow: {
    ...typography.label,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.surface,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  btn: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: glass.statFill,
    borderWidth: 1,
    borderColor: glass.statBorder,
  },
  btnTxt: { ...typography.title, color: colors.surface, letterSpacing: 0.5 },
});
