import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/tokens';

const DEFAULT_COLORS = [colors.coral, colors.sun, colors.sage];
const PARTICLE_COUNT = 14;

export interface ConfettiHandle {
  /** Fires a confetti burst centered at (x, y) within the parent's coordinate space. */
  fire: (x?: number, y?: number, colorSet?: string[]) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  anim: Animated.Value;
  dx: number;
  dy: number;
  rotateDeg: number;
}

let particleId = 0;

export const ConfettiBurst = forwardRef<ConfettiHandle>((_props, ref) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerSize = useRef({ width: 0, height: 0 });

  useImperativeHandle(ref, () => ({
    fire: (x, y, colorSet = DEFAULT_COLORS) => {
      const originX = x ?? containerSize.current.width / 2;
      const originY = y ?? containerSize.current.height / 2;

      const next: Particle[] = Array.from({ length: PARTICLE_COUNT }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 70;
        return {
          id: particleId++,
          x: originX,
          y: originY,
          color: colorSet[Math.floor(Math.random() * colorSet.length)],
          anim: new Animated.Value(0),
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 30,
          rotateDeg: Math.random() * 480 - 240,
        };
      });

      setParticles((prev) => [...prev, ...next]);

      next.forEach((p) => {
        Animated.timing(p.anim, { toValue: 1, duration: 850, useNativeDriver: true }).start();
      });

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !next.includes(p)));
      }, 900);
    },
  }));

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        containerSize.current = {
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        };
      }}
    >
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: 7,
            height: 7,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              {
                translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }),
              },
              {
                translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }),
              },
              {
                rotate: p.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${p.rotateDeg}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
});

ConfettiBurst.displayName = 'ConfettiBurst';
