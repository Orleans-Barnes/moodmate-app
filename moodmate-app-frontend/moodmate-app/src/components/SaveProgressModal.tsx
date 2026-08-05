/**
 * SaveProgressModal — fires once per guest session when they complete an activity.
 *
 * Shows what they just did + XP they "would have earned", with a strong CTA
 * to create a free account (Duolingo-style: feel the value, then gate once).
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGuestStore } from '@/state/useGuestStore';
import { colors, fonts, fontSizes, spacing } from '@/theme/tokens';

interface Props {
  onCreateAccount: () => void;
}

export function SaveProgressModal({ onCreateAccount }: Props) {
  const { isModalVisible, modalActivity, modalXp, hideProgressModal } = useGuestStore();

  // Blob pulse animation
  const blobScale = useRef(new Animated.Value(0.85)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isModalVisible) return;

    // Entry animation
    Animated.parallel([
      Animated.spring(fadeIn, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
      Animated.spring(blobScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();

    // Idle pulse
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobScale, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(blobScale, { toValue: 1.00, duration: 1400, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), 600);
    return () => { clearTimeout(t); loop.stop(); };
  }, [isModalVisible]);

  const handleDismiss = () => {
    Animated.timing(fadeIn, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      hideProgressModal();
      fadeIn.setValue(0);
    });
  };

  const handleCreate = () => {
    hideProgressModal();
    onCreateAccount();
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { opacity: fadeIn, transform: [{ translateY: fadeIn.interpolate({ inputRange: [0,1], outputRange: [60, 0] }) }] }]}>

          {/* Animated blob */}
          <View style={s.blobWrap}>
            <Animated.View style={[s.blob, { transform: [{ scale: blobScale }] }]}>
              <LinearGradient
                colors={['#468752', colors.coral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.blobGrad}
              >
                <Ionicons name="trophy" size={38} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Text */}
          <Text style={s.headline}>Nice work!</Text>
          <Text style={s.activity}>{modalActivity}</Text>
          <View style={s.xpRow}>
            <View style={s.xpPill}>
              <Text style={s.xpTxt}>+{modalXp} XP</Text>
            </View>
            <Text style={s.xpNote}>waiting for you</Text>
          </View>

          <Text style={s.body}>
            Create a free account to save your progress, earn badges, and keep your streak alive.
          </Text>

          {/* CTA */}
          <Pressable style={s.cta} onPress={handleCreate}>
            <Text style={s.ctaTxt}>Create free account  →</Text>
          </Pressable>

          {/* Dismiss */}
          <Pressable style={s.later} onPress={handleDismiss}>
            <Text style={s.laterTxt}>Maybe later</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 36,
    alignItems: 'center',
    gap: spacing.md,
  },

  // Blob
  blobWrap: { marginBottom: 4 },
  blob: {
    width: 90,
    height: 90,
    borderRadius: 28,
    // overflow:'hidden' removed — clips elevation shadow on Android
    // Use borderRadius on inner LinearGradient instead
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  blobGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headline: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    textAlign: 'center',
  },
  activity: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.base,
    color: '#444',
    textAlign: 'center',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpPill: {
    backgroundColor: colors.coralSoft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: colors.coral,
  },
  xpTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: colors.coral,
  },
  xpNote: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: '#666',
  },
  body: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: '#555',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  cta: {
    width: '100%',
    backgroundColor: colors.coral,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaTxt: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
  later: { paddingVertical: 8 },
  laterTxt: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: '#999',
  },
});
