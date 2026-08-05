import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, fonts, fontSizes, radii, glass, calm } from '@/theme/tokens';
import { DarkGlassView } from '@/components/GlassView';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const COMPACT_ON_Y = 104;
const COMPACT_OFF_Y = 44;
const DETAIL_UNMOUNT_DELAY_MS = 150;

export interface HeroHeaderStat {
  key: string;
  icon?: ReactNode;
  value: string | number;
  label: string;
}

interface HeroHeaderProps {
  /** Each screen keeps its own brand gradient (coral for Home, blue for Counsellor,
   * green for Mentor, etc) — this component unifies the *shape*, not the color. */
  gradient: readonly [string, string, ...string[]];
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  /** Row of glassmorphism stat pills, e.g. streak/level/goals-done. */
  stats?: HeroHeaderStat[];
  /** Extra content rendered below the stats row (e.g. an XP bar). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Legacy curve flag; headers now keep a straight bottom edge to avoid bright corner gaps. */
  curved?: boolean;
  /** Background colour of content sitting below the header */
  contentBg?: string;
  /** Optional scroll progress from the screen body; used for a compact calm lift. */
  scrollY?: Animated.Value;
}

/**
 * Shared "hero" header shape for tab-root and dashboard screens — gradient
 * background, safe-area-aware top padding, title/subtitle, optional
 * glassmorphism stat-pill row, optional extra content slot. Replaces the 15+
 * independently hand-rolled LinearGradient headers found across the app;
 * screens should still supply their own on-brand gradient colors.
 */
export function HeroHeader({ gradient, title, subtitle, rightSlot, stats, children, style, curved = true, contentBg = calm.bg, scrollY }: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const compactRef = useRef(false);
  const compactMotion = useRef(new Animated.Value(0)).current;
  const compactShape = useRef(new Animated.Value(0)).current;
  const detailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layoutCompact, setLayoutCompact] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(true);

  useEffect(() => {
    if (!scrollY) return undefined;

    const listenerId = scrollY.addListener(({ value }) => {
      const nextCompact = compactRef.current ? value > COMPACT_OFF_Y : value > COMPACT_ON_Y;
      if (nextCompact === compactRef.current) return;
      compactRef.current = nextCompact;
      compactMotion.stopAnimation();
      compactShape.stopAnimation();
      if (detailTimerRef.current) {
        clearTimeout(detailTimerRef.current);
        detailTimerRef.current = null;
      }

      if (nextCompact) {
        detailTimerRef.current = setTimeout(() => {
          setDetailsVisible(false);
          setLayoutCompact(true);
          detailTimerRef.current = null;
        }, DETAIL_UNMOUNT_DELAY_MS);
      } else {
        setLayoutCompact(false);
        setDetailsVisible(true);
      }

      const toValue = nextCompact ? 1 : 0;
      const duration = nextCompact ? 220 : 260;
      const easing = nextCompact ? Easing.out(Easing.cubic) : Easing.out(Easing.quad);
      Animated.parallel([
        Animated.timing(compactMotion, { toValue, duration, easing, useNativeDriver: true }),
        Animated.timing(compactShape, { toValue, duration, easing, useNativeDriver: false }),
      ]).start();
    });

    return () => {
      scrollY.removeListener(listenerId);
      if (detailTimerRef.current) clearTimeout(detailTimerRef.current);
    };
  }, [compactMotion, compactShape, scrollY]);

  const subtitleStyle = {
    opacity: compactMotion.interpolate({
      inputRange: [0, 0.74, 1],
      outputRange: [1, 0.2, 0],
    }),
    transform: [
      {
        translateY: compactMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
      {
        scale: compactMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.98],
        }),
      },
    ],
  };
  const detailsStyle = {
    opacity: compactMotion.interpolate({
      inputRange: [0, 0.72, 1],
      outputRange: [1, 0.16, 0],
    }),
    transform: [
      {
        translateY: compactMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
      {
        scale: compactMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.98],
        }),
      },
    ],
  };
  const orbStyle = {
    opacity: compactMotion.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        scale: compactMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.72],
        }),
      },
      {
        translateY: compactMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -16],
        }),
      },
    ],
  };
  const compactDividerStyle = {
    opacity: compactMotion.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };
  const titleStyle = {
    transform: [
      {
        scale: compactMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.94],
        }),
      },
    ],
  };

  return (
    <Animated.View style={curved ? [styles.curvedWrap, { backgroundColor: contentBg }] : undefined}>
      <AnimatedLinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: insets.top + (layoutCompact ? spacing.sm : spacing.md),
            paddingBottom: layoutCompact ? spacing.sm + 2 : spacing.lg,
          },
          style,
        ]}
      >
        <Animated.View style={[styles.orbAccent, orbStyle]} />

        <Animated.View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <Animated.Text style={[styles.title, titleStyle]} numberOfLines={1}>{title}</Animated.Text>
            {subtitle && !layoutCompact ? <Animated.Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>{subtitle}</Animated.Text> : null}
          </View>
          {rightSlot}
        </Animated.View>

        {detailsVisible && ((stats && stats.length > 0) || children) ? (
          <Animated.View style={[styles.detailsWrap, detailsStyle]}>
            {stats && stats.length > 0 && (
              <View style={styles.statsRow}>
                {stats.map((stat) => (
                  <DarkGlassView
                    key={stat.key}
                    style={styles.statPill}
                    borderRadius={radii.md}
                    overlayColor={glass.statFill}
                    borderColor={glass.statBorder}
                  >
                    {stat.icon}
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </DarkGlassView>
                ))}
              </View>
            )}

            {children}
          </Animated.View>
        ) : null}
        {curved ? <Animated.View pointerEvents="none" style={[styles.compactDivider, compactDividerStyle]} /> : null}
      </AnimatedLinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curvedWrap: {
    position: 'relative',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  orbAccent: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  compactDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSizes.lg + 1,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
    overflow: 'hidden',
  },
  detailsWrap: {
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },
});
