import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface FadeInItemProps {
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

// Lightweight staggered fade+rise entrance for list rows on the admin screens (per user request:
// "nice animations to the scrolling in the admins, be fast"). Purely opacity/translateY on the
// native driver - no layout-affecting properties, so this never blocks the JS thread or the
// initial render of the actual data. Delay is capped so a long roster doesn't feel sluggish to
// finish animating in; every item still starts within a third of a second of the list appearing.
export function FadeInItem({ index = 0, style, children }: FadeInItemProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index * 45, 300);
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      delay,
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
