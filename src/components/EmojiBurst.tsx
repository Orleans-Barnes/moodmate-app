import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export interface EmojiBurstHandle {
  /** Pops `emoji` at (x, y) in the parent's coordinate space, then floats up and fades. */
  fire: (emoji: string, x: number, y: number) => void;
}

interface Burst {
  id: number;
  emoji: string;
  x: number;
  y: number;
  anim: Animated.Value;
}

let burstId = 0;

/**
 * Small reaction-pop animation for emoji buttons (Community tab "likes").
 * Built on RN's core Animated API only — same pattern as ConfettiBurst,
 * since the project has no animation library installed.
 */
export const EmojiBurst = forwardRef<EmojiBurstHandle>((_props, ref) => {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useImperativeHandle(ref, () => ({
    fire: (emoji, x, y) => {
      const burst: Burst = { id: burstId++, emoji, x, y, anim: new Animated.Value(0) };
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
        <Animated.Text
          key={b.id}
          style={[
            styles.emoji,
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
          {b.emoji}
        </Animated.Text>
      ))}
    </View>
  );
});

EmojiBurst.displayName = 'EmojiBurst';

const styles = StyleSheet.create({
  emoji: { position: 'absolute', fontSize: 30 },
});
