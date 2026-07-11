import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface Props {
  isPlaying: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

// Each bar has a different animation phase + speed for organic wave feel
const BAR_CONFIGS = [
  { minH: 3,  maxH: 14, duration: 1200, delay: 0   },
  { minH: 3,  maxH: 9,  duration: 900,  delay: 150 },
  { minH: 3,  maxH: 18, duration: 1400, delay: 300 },
  { minH: 3,  maxH: 11, duration: 1100, delay: 80  },
  { minH: 3,  maxH: 16, duration: 800,  delay: 220 },
  { minH: 3,  maxH: 8,  duration: 1300, delay: 60  },
  { minH: 3,  maxH: 13, duration: 950,  delay: 180 },
];

export function WaveformVisualizer({ isPlaying, color = '#818CF8', barCount = 7, height = 22 }: Props) {
  const anims = useRef(BAR_CONFIGS.slice(0, barCount).map(() => new Animated.Value(0))).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Stop all existing loops
    loopsRef.current.forEach((l) => l.stop());
    loopsRef.current = [];

    if (!isPlaying) {
      // Flatten to minimum height when not playing
      anims.forEach((a) => Animated.timing(a, { toValue: 0, duration: 300, useNativeDriver: false }).start());
      return;
    }

    // Start each bar's independent loop with its phase offset
    BAR_CONFIGS.slice(0, barCount).forEach((cfg, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(cfg.delay),
          Animated.timing(anims[i], {
            toValue: 1,
            duration: cfg.duration / 2,
            useNativeDriver: false,
          }),
          Animated.timing(anims[i], {
            toValue: 0,
            duration: cfg.duration / 2,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      loopsRef.current.push(loop);
    });

    return () => {
      loopsRef.current.forEach((l) => l.stop());
    };
  }, [isPlaying, barCount]);

  return (
    <View style={[s.container, { height }]}>
      {BAR_CONFIGS.slice(0, barCount).map((cfg, i) => {
        const barHeight = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [cfg.minH, Math.min(cfg.maxH, height)],
        });
        return (
          <Animated.View
            key={i}
            style={[s.bar, { height: barHeight, backgroundColor: color, opacity: isPlaying ? 0.85 : 0.35 }]}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
