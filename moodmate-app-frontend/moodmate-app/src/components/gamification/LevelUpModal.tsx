/**
 * LevelUpModal — Full-screen celebration overlay shown when the user levels up.
 * Triggered imperatively via ref.
 *
 * Usage:
 *   const lvlRef = useRef<LevelUpHandle>(null);
 *   lvlRef.current?.celebrate(newLevel);
 *   <LevelUpModal ref={lvlRef} />
 */
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, Pressable, StyleSheet, Text, View, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');

export interface LevelUpHandle {
  celebrate: (level: number) => void;
}

const LEVEL_MSGS = [
  'Keep going — you\'re building momentum!',
  'Consistency is your superpower.',
  'Your wellness journey is paying off!',
  'Every check-in moves you forward.',
  'You\'re becoming unstoppable.',
  'Your mind is growing stronger.',
];

export const LevelUpModal = forwardRef<LevelUpHandle>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [level, setLevel]     = useState(1);

  const cardScale    = useRef(new Animated.Value(0.6)).current;
  const cardOpacity  = useRef(new Animated.Value(0)).current;
  const starRotate   = useRef(new Animated.Value(0)).current;
  const starScale    = useRef(new Animated.Value(0)).current;
  const glowPulse    = useRef(new Animated.Value(1)).current;
  const shimmerX     = useRef(new Animated.Value(-W)).current;

  useImperativeHandle(ref, () => ({
    celebrate(newLevel: number) {
      setLevel(newLevel);
      setVisible(true);

      cardScale.setValue(0.6);
      cardOpacity.setValue(0);
      starRotate.setValue(0);
      starScale.setValue(0);
      glowPulse.setValue(1);
      shimmerX.setValue(-W);

      Animated.parallel([
        // Card entrance
        Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        // Star spin + pop
        Animated.sequence([
          Animated.timing(starRotate, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        ]),
        Animated.spring(starScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        // Shimmer
        Animated.loop(Animated.sequence([
          Animated.delay(600),
          Animated.timing(shimmerX, { toValue: W, duration: 900, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(shimmerX, { toValue: -W, duration: 0, useNativeDriver: true }),
        ])),
        // Glow pulse
        Animated.loop(Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])),
      ]).start();
    },
  }));

  const dismiss = () => setVisible(false);
  const spinDeg = starRotate.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });
  const msg = LEVEL_MSGS[(level - 1) % LEVEL_MSGS.length];

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={dismiss}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
        <Pressable style={styles.backdrop} onPress={dismiss}>
          <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
            {/* Gradient card */}
            <LinearGradient
              colors={['#312E81', '#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              {/* Shimmer */}
              <Animated.View
                pointerEvents="none"
                style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
              />

              {/* Star burst */}
              <Animated.View style={[styles.starWrap, { transform: [{ scale: glowPulse }] }]}>
                <View style={styles.starGlow} />
                <Animated.View style={{ transform: [{ rotate: spinDeg }, { scale: starScale }] }}>
                  <Ionicons name="star" size={56} color="#FDE68A" />
                </Animated.View>
              </Animated.View>

              <Text style={styles.levelUpTxt}>LEVEL UP!</Text>
              <Text style={styles.levelNum}>Level {level}</Text>
              <Text style={styles.msg}>{msg}</Text>

              {/* Dismiss */}
              <Pressable style={styles.btn} onPress={dismiss}>
                <Text style={styles.btnTxt}>Awesome!</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </BlurView>
    </Modal>
  );
});

LevelUpModal.displayName = 'LevelUpModal';

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: W - 48,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  gradient: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 140,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 80,
    transform: [{ skewX: '-20deg' }],
  },
  starWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  starGlow: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(253,230,138,0.25)',
  },
  levelUpTxt: {
    fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6,
  },
  levelNum: {
    fontSize: 42, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -1, marginBottom: 12,
  },
  msg: {
    fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});
