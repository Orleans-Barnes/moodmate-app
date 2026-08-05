/**
 * StreakBumpCard — slides up from the bottom when a streak day is earned.
 * Dismiss by tapping anywhere or it auto-dismisses after 3.5 s.
 *
 * Usage:
 *   const streakRef = useRef<StreakBumpHandle>(null);
 *   streakRef.current?.show(2);           // day 2
 *   streakRef.current?.show(7, true);     // milestone — extra celebration
 *   <StreakBumpCard ref={streakRef} />
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: W, height: H } = Dimensions.get('window');

const STREAK_MSGS: Record<number, string> = {
  1:  "You started your streak! Come back tomorrow.",
  2:  "Two days in a row — momentum is building!",
  3:  "Three days strong! A habit is forming.",
  4:  "Day 4! You're proving your commitment.",
  5:  "Five days! Almost a full week — don't stop.",
  6:  "Day 6! One more day for a full week.",
  7:  "One full week! You're unstoppable.",
  14: "Two weeks straight — legendary consistency.",
  21: "21 days! Science says that's a habit now.",
  30: "30-day streak! You are an absolute legend.",
  50: "50 days! Most people never get here.",
  100:"100 DAYS! You are in the top 1% of wellness.",
};

function getMsg(day: number): string {
  if (STREAK_MSGS[day]) return STREAK_MSGS[day];
  if (day < 7)  return `Day ${day}! You're building real momentum.`;
  if (day < 14) return `${day} days in a row — your future self thanks you.`;
  if (day < 30) return `${day}-day streak! Consistency is your superpower.`;
  return `${day} days! You're in rare company.`;
}

const MILESTONE_DAYS = [3, 7, 14, 21, 30, 50, 100];

export interface StreakBumpHandle {
  show: (day: number, isMilestone?: boolean) => void;
}

export const StreakBumpCard = forwardRef<StreakBumpHandle>((_, ref) => {
  const [visible, setVisible]     = useState(false);
  const [day, setDay]             = useState(1);
  const [milestone, setMilestone] = useState(false);

  const slideY  = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.88)).current;
  const flameSc = useRef(new Animated.Value(1)).current;
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    show(newDay: number, isMilestone = MILESTONE_DAYS.includes(newDay)) {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      setDay(newDay);
      setMilestone(isMilestone);
      setVisible(true);

      slideY.setValue(300);
      opacity.setValue(0);
      scale.setValue(0.88);
      flameSc.setValue(1);

      if (isMilestone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Animated.parallel([
        Animated.spring(slideY,  { toValue: 0,   friction: 7, tension: 80,  useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 220,             useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1,   friction: 6, tension: 100, useNativeDriver: true }),
        Animated.loop(Animated.sequence([
          Animated.timing(flameSc, { toValue: 1.22, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(flameSc, { toValue: 0.9,  duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])),
      ]).start();

      autoTimer.current = setTimeout(() => dismiss(), isMilestone ? 4500 : 3000);
    },
  }));

  const dismiss = () => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    Animated.parallel([
      Animated.timing(slideY,  { toValue: 300, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,   duration: 240, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  if (!visible) return null;

  const gradColors: [string, string] = milestone
    ? ['#7C3AED', '#4F46E5']
    : ['#EA580C', '#F59E0B'];

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={dismiss}>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <Animated.View style={[
          styles.cardWrap,
          { transform: [{ translateY: slideY }, { scale }], opacity },
        ]}>
          <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>

            {/* Shimmer */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.shimmer} />
            </View>

            {/* Flame icon */}
            <Animated.View style={[styles.iconWrap, { transform: [{ scale: flameSc }] }]}>
              <Ionicons name="flame" size={milestone ? 52 : 44} color="#FDE68A" />
            </Animated.View>

            {/* Day badge */}
            <View style={styles.dayBadge}>
              <Text style={styles.dayNum}>{day}</Text>
              <Text style={styles.dayLabel}>day streak</Text>
            </View>

            <Text style={styles.msg}>{getMsg(day)}</Text>

            {milestone && (
              <View style={styles.milestonePill}>
                <Ionicons name="trophy" size={13} color="#FDE68A" />
                <Text style={styles.milestoneTxt}>Milestone Unlocked!</Text>
              </View>
            )}

            <Pressable style={styles.dismissBtn} onPress={dismiss}>
              <Text style={styles.dismissTxt}>Keep going!</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
});

StreakBumpCard.displayName = 'StreakBumpCard';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 18,
  },
  card: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 28,
  },
  shimmer: {
    position: 'absolute',
    top: 0, left: -80,
    width: 160, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ skewX: '-20deg' }],
  },
  iconWrap: { marginBottom: 12 },
  dayBadge: { alignItems: 'center', marginBottom: 10 },
  dayNum: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 60,
    letterSpacing: -2,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  msg: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    marginTop: 4,
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(253,230,138,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.4)',
    marginBottom: 18,
  },
  milestoneTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dismissTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
