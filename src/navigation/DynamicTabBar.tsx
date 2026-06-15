/**
 * DynamicTabBar — Apple-inspired expandable tab bar
 *
 * • Default: 5 core tabs + a "✦" expand button on the right
 * • Tap "✦" OR swipe left anywhere on the bar → Insights slides in with
 *   spring physics, joining the tab bar seamlessly
 * • Swipe right (or tap the now-"×" button) → Insights slides back out
 * • Tab widths compress/expand with a coordinated spring so everything
 *   breathes together — no hard jumps
 * • Long-press the expand button → layout switcher action sheet
 *   (switch between Dynamic and Standard modes)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { hapticSelection, hapticMedium, hapticHeavy } from '@/utils/haptics';
import { colors, fonts, fontSizes, glow, radii } from '@/theme/tokens';
import type { TabLayoutMode } from '@/state/useTabLayoutStore';
import { StylishPlusButton } from '@/components/StylishPlusButton';

// ── Constants ─────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

/** Tabs that are always visible. */
const CORE_TABS  = ['Home', 'Journal', 'Explore', 'Community', 'Support'] as const;
/** The tab that slides in. */
const SLIDE_TAB  = 'Insights';

const EXPAND_BTN_W = 46;      // width of the ✦ / × button
const BAR_H        = Platform.OS === 'ios' ? 84 : 64;
const PADDING_BOT  = Platform.OS === 'ios' ? 26 : 10;
const ICON_SIZE    = 22;

type IconKey = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { active: IconKey; inactive: IconKey }> = {
  Home:      { active: 'home',         inactive: 'home-outline' },
  Journal:   { active: 'book',         inactive: 'book-outline' },
  Explore:   { active: 'compass',      inactive: 'compass-outline' },
  Insights:  { active: 'analytics',    inactive: 'analytics-outline' },
  Community: { active: 'people',       inactive: 'people-outline' },
  Support:   { active: 'heart-circle', inactive: 'heart-circle-outline' },
};

// Try to load expo-blur; fallback to solid
let BlurView: React.ComponentType<any> | null = null;
try { BlurView = require('expo-blur').BlurView; } catch (_) {}

// ── TabBackground ─────────────────────────────────────────────────────────────
function TabBarBg() {
  if (BlurView) {
    return (
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,252,250,0.55)' }]} />
      </BlurView>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, {
      backgroundColor: 'rgba(255,252,250,0.94)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    }]} />
  );
}

// ── TabItem ───────────────────────────────────────────────────────────────────
interface TabItemProps {
  routeName: string;
  label: string;
  focused: boolean;
  widthAnim: Animated.Value;
  onPress: () => void;
}

function TabItem({ routeName, label, focused, widthAnim, onPress }: TabItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const icon = ICONS[routeName] ?? ICONS['Explore'];

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
    ]).start();
    hapticSelection();
    onPress();
  };

  return (
    <Animated.View style={{ width: widthAnim, overflow: 'hidden' }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.tabItem}
      >
        <Animated.View style={[
          styles.iconWrap,
          focused && styles.iconWrapActive,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Ionicons
            name={focused ? icon.active : icon.inactive}
            size={ICON_SIZE}
            color={focused ? colors.coral : colors.inkFaint}
          />
        </Animated.View>
        <Text
          style={[styles.label, { color: focused ? colors.coral : colors.inkFaint }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface DynamicTabBarProps extends BottomTabBarProps {
  layoutMode: TabLayoutMode;
  onRequestModeChange: () => void;
}

export function DynamicTabBar({
  state,
  descriptors,
  navigation,
  layoutMode,
  onRequestModeChange,
}: DynamicTabBarProps) {

  // ── Reveal animation (0 = Insights hidden, 1 = Insights visible) ───────────
  const revealAnim  = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);

  // ── Bar width (measured after layout) ──────────────────────────────────────
  const [barWidth, setBarWidth] = useState(SCREEN_W - 24);  // initial guess

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  // ── Per-tab animated widths ────────────────────────────────────────────────
  // In dynamic mode:
  //   collapsed: each core tab = (barWidth - expandBtnW) / 5
  //   expanded:  each core tab shrinks, Insights gets its share
  // In standard mode: equal width for all 6 tabs

  const coreTabW = useCallback((bw: number) => {
    if (layoutMode === 'standard') return bw / 6;
    // collapsed: 5 tabs share (barWidth - expandBtnW)
    return (bw - EXPAND_BTN_W) / CORE_TABS.length;
  }, [layoutMode]);

  const expandedCoreW  = useCallback((bw: number) => bw / 6, []);
  const expandedSlideW = useCallback((bw: number) => bw / 6, []);

  // Animated width for core tabs
  const coreWidthAnim = useRef(new Animated.Value(coreTabW(barWidth))).current;
  // Animated width for Insights (0 when hidden)
  const slideWidthAnim = useRef(new Animated.Value(layoutMode === 'standard' ? barWidth / 6 : 0)).current;
  // Button rotation (0 → 1 maps to 0° → 135°)
  const btnRotAnim = useRef(new Animated.Value(0)).current;
  // Overall bar slight scale breath on expand
  const barScaleAnim = useRef(new Animated.Value(1)).current;

  const springReveal = useCallback((toRevealed: boolean) => {
    const toValue = toRevealed ? 1 : 0;
    revealedRef.current = toRevealed;
    setRevealed(toRevealed);
    hapticMedium();

    const coreTarget  = toRevealed ? expandedCoreW(barWidth)  : coreTabW(barWidth);
    const slideTarget = toRevealed ? expandedSlideW(barWidth) : 0;

    Animated.parallel([
      // core tabs compress/expand
      Animated.spring(coreWidthAnim, {
        toValue: coreTarget, friction: 8, tension: 100, useNativeDriver: false,
      }),
      // insights tab slides in/out
      Animated.spring(slideWidthAnim, {
        toValue: slideTarget, friction: 7, tension: 90, useNativeDriver: false,
      }),
      // button rotates
      Animated.spring(btnRotAnim, {
        toValue, friction: 6, tension: 120, useNativeDriver: true,
      }),
      // bar micro-bounce
      Animated.sequence([
        Animated.timing(barScaleAnim, { toValue: 0.97, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(barScaleAnim, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }),
      ]),
      Animated.timing(revealAnim, { toValue, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [barWidth, coreTabW, expandedCoreW, expandedSlideW]);

  // ── PanResponder — swipe left/right to toggle ──────────────────────────────
  const panRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -30 && !revealedRef.current) {
          springReveal(true);
        } else if (g.dx > 30 && revealedRef.current) {
          springReveal(false);
        }
      },
    }),
  ).current;

  // ── Derive active route ────────────────────────────────────────────────────
  const activeRoute = state.routes[state.index]?.name ?? '';

  // ── Navigation helper ──────────────────────────────────────────────────────
  const navigateTo = useCallback((routeName: string) => {
    const event = navigation.emit({ type: 'tabPress', target: routeName, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName as never);
    }
  }, [navigation]);

  // ── Insights tab opacity (fades in as it slides) ──────────────────────────
  const slideOpacity = revealAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.7, 1],
  });

  // ── Long-press on expand btn → mode picker ─────────────────────────────────
  const handleLongPress = () => {
    hapticHeavy();
    onRequestModeChange();
  };

  // ── In STANDARD mode, render all 6 tabs normally ─────────────────────────
  if (layoutMode === 'standard') {
    const stdW = barWidth / state.routes.length;
    return (
      <View style={styles.outerWrap}>
        <Animated.View style={[styles.bar, { transform: [{ scale: barScaleAnim }] }]}
          onLayout={onBarLayout} {...panRef.panHandlers}>
          <TabBarBg />
          {state.routes.map((route) => {
            const focused = route.name === activeRoute;
            const staticW = new Animated.Value(stdW);
            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                label={descriptors[route.key]?.options.tabBarLabel as string ?? route.name}
                focused={focused}
                widthAnim={staticW}
                onPress={() => navigateTo(route.name)}
              />
            );
          })}

          {/* Settings hint dot */}
          <TouchableOpacity
            style={styles.settingsHint}
            onLongPress={handleLongPress}
            delayLongPress={600}
            hitSlop={8}
          >
            <View style={styles.settingsDot} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── DYNAMIC mode ───────────────────────────────────────────────────────────
  return (
    <View style={styles.outerWrap}>
      <Animated.View
        style={[styles.bar, { transform: [{ scale: barScaleAnim }] }]}
        onLayout={onBarLayout}
        {...panRef.panHandlers}
      >
        <TabBarBg />

        {/* Core 5 tabs */}
        {CORE_TABS.map(name => {
          const route = state.routes.find(r => r.name === name);
          if (!route) return null;
          const focused = route.name === activeRoute;
          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              label={descriptors[route.key]?.options.tabBarLabel as string ?? route.name}
              focused={focused}
              widthAnim={coreWidthAnim}
              onPress={() => navigateTo(route.name)}
            />
          );
        })}

        {/* Insights — slides in from the right */}
        <Animated.View style={{
          width: slideWidthAnim,
          overflow: 'hidden',
          opacity: slideOpacity,
        }}>
          {(() => {
            const route = state.routes.find(r => r.name === SLIDE_TAB);
            if (!route) return null;
            const focused = route.name === activeRoute;
            return (
              <TouchableOpacity
                onPress={() => { navigateTo(SLIDE_TAB); hapticSelection(); }}
                activeOpacity={0.7}
                style={styles.tabItem}
              >
                <View style={[
                  styles.iconWrap,
                  focused && styles.iconWrapInsights,
                ]}>
                  <Ionicons
                    name={focused ? 'analytics' : 'analytics-outline'}
                    size={ICON_SIZE}
                    color={focused ? '#2A5C45' : colors.inkFaint}
                  />
                </View>
                <Text
                  style={[styles.label, { color: focused ? '#2A5C45' : colors.inkFaint }]}
                  numberOfLines={1}
                >
                  Insights
                </Text>
              </TouchableOpacity>
            );
          })()}
        </Animated.View>

        {/* Expand / collapse button */}
        <TouchableOpacity
          onPress={() => springReveal(!revealed)}
          onLongPress={handleLongPress}
          delayLongPress={600}
          activeOpacity={0.7}
          style={styles.expandBtn}
          hitSlop={6}
        >
          <StylishPlusButton revealAnim={revealAnim} size={38} />
        </TouchableOpacity>
      </Animated.View>

      {/* Swipe hint label — appears under the bar on first render */}
      <Animated.Text style={[styles.swipeHint, {
        opacity: revealAnim.interpolate({ inputRange: [0, 0.2], outputRange: [0.55, 0] }),
      }]}>
        ← swipe for Insights
      </Animated.Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  bar: {
    flexDirection:  'row',
    alignItems:     'center',
    height:         BAR_H,
    marginHorizontal: 12,
    borderRadius:   26,
    overflow:       'hidden',
    shadowColor:    glow.coral,
    shadowOffset:   { width: 0, height: -3 },
    shadowOpacity:  0.20,
    shadowRadius:   20,
    elevation:      18,
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.75)',
    width:          SCREEN_W - 24,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: PADDING_BOT,
  },
  iconWrap: {
    width: 38, height: 30,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: colors.coralLight,
    shadowColor:    glow.coral,
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.35,
    shadowRadius:   6,
    elevation:      3,
  },
  iconWrapInsights: {
    backgroundColor: 'rgba(42,92,69,0.12)',
    shadowColor:    'rgba(42,92,69,0.4)',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.5,
    shadowRadius:   6,
    elevation:      3,
  },
  label: {
    fontFamily:   fonts.bodyBold,
    fontSize:     8.5,
    marginTop:    2,
    letterSpacing: 0.1,
  },

  expandBtn: {
    width:          EXPAND_BTN_W,
    height:         BAR_H,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    6,
    paddingBottom:  Platform.OS === 'ios' ? 16 : 6,
  },

  swipeHint: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize:   10,
    color:      colors.inkFaint,
    letterSpacing: 0.2,
  },

  // Standard mode settings hint
  settingsHint: {
    width: 20, height: BAR_H,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  settingsDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.inkFaint,
    marginBottom: Platform.OS === 'ios' ? 16 : 6,
  },
});
