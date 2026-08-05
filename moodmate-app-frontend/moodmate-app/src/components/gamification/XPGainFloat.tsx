/**
 * XPGainFloat — Floating "+X XP" indicator that animates up and fades out.
 *
 * Usage:
 *   const xpRef = useRef<XPGainHandle>(null);
 *   // trigger when XP is earned:
 *   xpRef.current?.show(15);
 *
 *   <XPGainFloat ref={xpRef} />
 */
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface XPGainHandle {
  show: (amount: number) => void;
}

interface Props {
  /** Position from bottom of parent (default 140) */
  bottom?: number;
}

export const XPGainFloat = forwardRef<XPGainHandle, Props>(({ bottom = 140 }, ref) => {
  const [amount, setAmount] = useState(0);
  const opacity     = useRef(new Animated.Value(0)).current;
  const translateY  = useRef(new Animated.Value(0)).current;
  const scale       = useRef(new Animated.Value(0.5)).current;

  useImperativeHandle(ref, () => ({
    show(xp: number) {
      setAmount(xp);
      opacity.setValue(0);
      translateY.setValue(0);
      scale.setValue(0.5);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.delay(700),
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.timing(translateY, {
          toValue: -80, duration: 1300,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(scale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
        ]),
      ]).start();
    },
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom, opacity, transform: [{ translateY }, { scale }] }]}
    >
      <View style={styles.pill}>
        <Ionicons name="star" size={13} color="#F59E0B" />
        <Text style={styles.txt}>+{amount} XP</Text>
      </View>
    </Animated.View>
  );
});

XPGainFloat.displayName = 'XPGainFloat';

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 24,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  txt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.3,
  },
});
