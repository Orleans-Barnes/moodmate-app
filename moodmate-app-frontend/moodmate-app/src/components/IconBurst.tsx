import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolveIcon, type IonName } from '@/theme/iconMap';

export interface IconBurstHandle {
  /** Pops an icon at (x, y), then floats up and fades. */
  fire: (iconKey: string, x: number, y: number) => void;
}

/** @deprecated Use IconBurstHandle */
export type EmojiBurstHandle = IconBurstHandle;

interface Burst {
  id: number;
  icon: IonName;
  x: number;
  y: number;
  anim: Animated.Value;
}

let burstId = 0;

/**
 * Reaction-pop animation for community likes — Ionicons instead of emoji text.
 */
export const IconBurst = forwardRef<IconBurstHandle>((_props, ref) => {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useImperativeHandle(ref, () => ({
    fire: (iconKey, x, y) => {
      const burst: Burst = {
        id: burstId++,
        icon: resolveIcon(iconKey, 'heart'),
        x,
        y,
        anim: new Animated.Value(0),
      };
      setBursts((prev) => [...prev, burst]);

      Animated.timing(burst.anim, { toValue: 1, duration: 750, useNativeDriver: true }).start();

      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burst.id));
      }, 780);
    },
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bursts.map((b) => (
        <Animated.View
          key={b.id}
          style={[
            s.wrap,
            {
              left: b.x - 16,
              top: b.y - 16,
              opacity: b.anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: b.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -55] }) },
                { scale: b.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.5, 1] }) },
              ],
            },
          ]}
        >
          <Ionicons name={b.icon} size={28} color="#579E65" />
        </Animated.View>
      ))}
    </View>
  );
});

IconBurst.displayName = 'IconBurst';

/** @deprecated Use IconBurst */
export const EmojiBurst = IconBurst;

const s = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
