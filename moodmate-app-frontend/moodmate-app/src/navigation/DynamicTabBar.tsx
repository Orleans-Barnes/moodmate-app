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

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { hapticSelection, hapticMedium, hapticHeavy } from '@/utils/haptics';
import { colors, fonts, calm, darkPalette } from '@/theme/tokens';
import type { TabLayoutMode } from '@/state/useTabLayoutStore';
import { useTabVisibilityStore } from '@/state/useTabVisibilityStore';
import { useResolvedAppearance } from '@/hooks/useResolvedAppearance';
import { StylishPlusButton } from '@/components/StylishPlusButton';

// ── Constants ─────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

/** Tabs that are always visible. */
const CORE_TABS  = ['Home', 'Journal', 'Explore', 'Community', 'Support'] as const;
/** The tab that slides in. */
const SLIDE_TAB  = 'Insights';

const EXPAND_BTN_W = 58;      // reserved action slot: plus when collapsed, Insights when revealed
const BAR_H        = Platform.OS === 'ios' ? 84 : 64;
const TAB_CONTENT_H = Platform.OS === 'ios' ? 56 : 50;
const TAB_BOTTOM_OFFSET = Platform.OS === 'ios' ? 18 : 5;
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
function TabBarBg({ isDark }: { isDark: boolean }) {
  if (BlurView) {
    return (
      <BlurView intensity={72} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(31,33,31,0.88)' : 'rgba(248,250,248,0.62)' },
          ]}
        />
      </BlurView>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, {
      backgroundColor: isDark ? 'rgba(31,33,31,0.98)' : 'rgba(255,255,255,0.96)',
      borderWidth: 1, borderColor: isDark ? darkPalette.border : calm.border,
    }]} />
  );
}

// ── TabItem ───────────────────────────────────────────────────────────────────
interface TabItemProps {
  routeName: string;
  label: string;
  focused: boolean;
  width: number;
  onPress: () => void;
  isDark: boolean;
}

function TabItem({ routeName, label, focused, width, onPress, isDark }: TabItemProps) {
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
    <View style={[styles.tabSlot, { width }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel={`${label} tab`}
        accessibilityHint={`Opens the ${label} section`}
        accessibilityState={{ selected: focused }}
      >
        <Animated.View style={[
          styles.iconWrap,
          focused && styles.iconWrapActive,
          isDark && focused && styles.iconWrapActiveDark,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Ionicons
            name={focused ? icon.active : icon.inactive}
            size={ICON_SIZE}
            color={focused ? (isDark ? darkPalette.primary : calm.primary) : (isDark ? darkPalette.textMuted : calm.faint)}
          />
        </Animated.View>
        <Text
          style={[styles.label, { color: focused ? (isDark ? darkPalette.text : calm.forest) : (isDark ? darkPalette.textMuted : calm.faint) }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface DynamicTabBarProps extends BottomTabBarProps {
  layoutMode: TabLayoutMode;
  /** True once useTabLayoutStore has finished reading the persisted mode from AsyncStorage. */
  hydrated: boolean;
  onRequestModeChange: () => void;
}

export function DynamicTabBar({
  state,
  descriptors,
  navigation,
  layoutMode,
  hydrated,
  onRequestModeChange,
}: DynamicTabBarProps) {
  const { isDark } = useResolvedAppearance();

  // Bug fix - belt-and-suspenders on top of the useTabLayoutStore.ts fix: if `hydrated` somehow
  // never flips true for any reason, the bottom nav bar must not stay invisible for the rest of
  // the session (that's a severe UX failure - see this component's earlier bug where exactly
  // that happened). Force the real bar to show after a bounded wait regardless of `hydrated`, so
  // the worst case is a brief mode flip on cold start rather than a vanished nav bar.
  const [forceShow, setForceShow] = useState(false);
  const tabVisible = useTabVisibilityStore((s) => s.visible);
  const showTabBar = useTabVisibilityStore((s) => s.showTabBar);
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => setForceShow(true), 1200);
    return () => clearTimeout(t);
  }, []);
  const showRealBar = hydrated || forceShow;

  useEffect(() => {
    Animated.timing(tabSlideAnim, {
      toValue: tabVisible ? 0 : 1,
      duration: tabVisible ? 260 : 220,
      easing: tabVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tabSlideAnim, tabVisible]);

  // ── Reveal animation (0 = Insights hidden, 1 = Insights visible) ───────────
  const revealAnim  = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);
  const activeRouteRef = useRef('');

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


  // Button rotation (0 → 1 maps to 0° → 135°)
  const btnRotAnim = useRef(new Animated.Value(0)).current;
  // Overall bar slight scale breath on expand
  const barScaleAnim = useRef(new Animated.Value(1)).current;

  const isAnimatingRef = useRef(false);

  const springReveal = useCallback((toRevealed: boolean) => {
    if (!toRevealed && activeRouteRef.current === SLIDE_TAB) return;
    // Tab-bar fix - guard against overlapping taps starting a second Animated.parallel before the
    // first one settles, which is what produced the plus button's "blink" (two competing rotation/
    // scale animations racing to different end values on the same Animated.Value nodes). Stop
    // whatever is in flight first, so every springReveal call starts from a clean, current value.
    btnRotAnim.stopAnimation();
    barScaleAnim.stopAnimation();
    revealAnim.stopAnimation();

    const toValue = toRevealed ? 1 : 0;
    revealedRef.current = toRevealed;
    if (toRevealed) {
      setRevealed(true);
    }
    hapticMedium();

    isAnimatingRef.current = true;
    Animated.parallel([
      // button rotates
      Animated.spring(btnRotAnim, {
        toValue, friction: 6, tension: 120, useNativeDriver: true,
      }),
      // bar micro-bounce
      Animated.sequence([
        Animated.timing(barScaleAnim, { toValue: 0.97, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(barScaleAnim, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }),
      ]),
      Animated.timing(revealAnim, { toValue, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      if (!toRevealed) {
        setRevealed(false);
      }
      isAnimatingRef.current = false;
    });
  }, []);

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
  activeRouteRef.current = activeRoute;
  const insightsActive = activeRoute === SLIDE_TAB;

  // ── Navigation helper ──────────────────────────────────────────────────────
  const navigateTo = useCallback((routeName: string) => {
    showTabBar();
    const event = navigation.emit({ type: 'tabPress', target: routeName, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName as never);
    }
  }, [navigation, showTabBar]);

  useEffect(() => {
    if (layoutMode === 'dynamic' && insightsActive && !revealedRef.current) {
      revealedRef.current = true;
      setRevealed(true);
      revealAnim.setValue(1);
      btnRotAnim.setValue(1);
    }
  }, [btnRotAnim, insightsActive, layoutMode, revealAnim]);

  const hiddenTranslateY = tabSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_H + 34],
  });
  const hiddenOpacity = tabSlideAnim.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [1, 0.34, 0],
  });
  const hiddenScale = tabSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });
  const tabBarMotionStyle = {
    opacity: hiddenOpacity,
    transform: [
      { translateY: hiddenTranslateY },
      { scale: Animated.multiply(barScaleAnim, hiddenScale) },
    ],
  };

  // ── Insights tab opacity (fades in as it slides) ──────────────────────────
  const hintOpacity = revealAnim.interpolate({
    inputRange: [0, 0.2],
    outputRange: [0.55, 0],
  });
  const hintTranslateY = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });
  const dynamicCoreWidth = coreTabW(barWidth);
  const actionSlotShowsInsights = revealed || insightsActive;
  const plusOpacity = revealAnim.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.18, 0],
  });
  const plusScale = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.82],
  });
  const insightIconOpacity = revealAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.2, 1],
  });
  const insightIconTranslateX = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const insightIconScale = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  const handleActionPress = useCallback(() => {
    if (actionSlotShowsInsights) {
      navigateTo(SLIDE_TAB);
      hapticSelection();
      return;
    }
    springReveal(true);
  }, [actionSlotShowsInsights, navigateTo, springReveal]);

  // ── Long-press on expand btn → mode picker ─────────────────────────────────
  const handleLongPress = () => {
    hapticHeavy();
    onRequestModeChange();
  };

  // Tab-bar fix - `layoutMode` defaults to 'dynamic' the instant this component mounts, before
  // useTabLayoutStore has had a chance to read the user's actually-persisted choice from
  // AsyncStorage (that read is itself async). If the persisted choice turns out to be 'standard',
  // the bar used to render dynamic first and then visibly flip to standard a beat later — the
  // "navigation tab just changes position" symptom. Render a plain, static placeholder of the same
  // height until hydration completes, then mount the real (correctly-moded) bar exactly once.
  if (!showRealBar) {
    return (
      <View pointerEvents="box-none" style={styles.outerWrap}>
        <View style={[styles.bar, isDark && styles.barDark, { opacity: 0 }]} />
      </View>
    );
  }

  // ── In STANDARD mode, render all 6 tabs normally ─────────────────────────
  if (layoutMode === 'standard') {
    const stdW = barWidth / state.routes.length;
    return (
      <View pointerEvents="box-none" style={styles.outerWrap}>
        {!tabVisible && (
          <Pressable
            style={styles.revealTouchZone}
            onPress={showTabBar}
            accessibilityRole="button"
            accessibilityLabel="Show navigation bar"
          />
        )}
        <Animated.View style={[styles.bar, isDark && styles.barDark, tabBarMotionStyle]}
          onLayout={onBarLayout} {...panRef.panHandlers}>
          <TabBarBg isDark={isDark} />
          {state.routes.map((route) => {
            const focused = route.name === activeRoute;
            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                label={descriptors[route.key]?.options.tabBarLabel as string ?? route.name}
                focused={focused}
                width={stdW}
                onPress={() => navigateTo(route.name)}
                isDark={isDark}
              />
            );
          })}

          {/* Settings hint dot */}
          <TouchableOpacity
            style={styles.settingsHint}
            onPress={onRequestModeChange}
            onLongPress={handleLongPress}
            delayLongPress={600}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Tab layout options"
            accessibilityHint="Opens navigation layout options"
          >
            <View style={styles.settingsDot} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── DYNAMIC mode ───────────────────────────────────────────────────────────
  return (
    <View pointerEvents="box-none" style={styles.outerWrap}>
      {!tabVisible && (
        <Pressable
          style={styles.revealTouchZone}
          onPress={showTabBar}
          accessibilityRole="button"
          accessibilityLabel="Show navigation bar"
        />
      )}
      <Animated.View
        style={[styles.bar, isDark && styles.barDark, tabBarMotionStyle]}
        onLayout={onBarLayout}
        {...panRef.panHandlers}
      >
        <TabBarBg isDark={isDark} />

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
              width={dynamicCoreWidth}
              onPress={() => navigateTo(route.name)}
              isDark={isDark}
            />
          );
        })}

        {/* Plus morphs into Insights */}
        <TouchableOpacity
          onPress={handleActionPress}
          onLongPress={handleLongPress}
          delayLongPress={600}
          activeOpacity={0.7}
          style={styles.expandBtn}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={actionSlotShowsInsights ? 'Open AI Insights tab' : 'Reveal AI Insights tab'}
          accessibilityHint="Long press for navigation layout options"
          accessibilityState={{ selected: insightsActive, expanded: actionSlotShowsInsights }}
        >
          <View style={styles.expandBtnInner}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.actionLayer,
                {
                  opacity: plusOpacity,
                  transform: [{ scale: plusScale }],
                },
              ]}
            >
              <StylishPlusButton progressAnim={btnRotAnim} size={38} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.actionLayer,
                {
                  opacity: insightIconOpacity,
                  transform: [
                    { translateX: insightIconTranslateX },
                    { scale: insightIconScale },
                  ],
                },
              ]}
            >
              <View style={[styles.iconWrap, insightsActive && styles.iconWrapInsights, isDark && insightsActive && styles.iconWrapActiveDark]}>
                <Ionicons
                  name={insightsActive ? 'analytics' : 'analytics-outline'}
                  size={ICON_SIZE}
                  color={insightsActive ? (isDark ? darkPalette.primary : calm.primary) : (isDark ? darkPalette.textMuted : calm.faint)}
                />
              </View>
              <Text
                style={[styles.label, { color: insightsActive ? (isDark ? darkPalette.text : calm.forest) : (isDark ? darkPalette.textMuted : calm.faint) }]}
                numberOfLines={1}
              >
                AI
              </Text>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipe hint label — appears under the bar on first render */}
      {tabVisible && (
        <Animated.Text style={[styles.swipeHint, {
          opacity: hintOpacity,
          transform: [{ translateY: hintTranslateY }],
        }]}>
          swipe for Insights
        </Animated.Text>
      )}
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
  revealTouchZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_H + 26,
  },
  bar: {
    flexDirection:  'row',
    alignItems:     'center',
    height:         BAR_H,
    marginHorizontal: 14,
    borderRadius:   28,
    overflow:       'hidden',
    shadowColor:    '#1B2A20',
    shadowOffset:   { width: 0, height: 8 },
    shadowOpacity:  0.14,
    shadowRadius:   18,
    elevation:      16,
    borderWidth:    1,
    borderColor:    'rgba(223,230,225,0.95)',
    width:          SCREEN_W - 28,
  },
  barDark: {
    shadowColor: '#000000',
    borderColor: darkPalette.border,
  },
  tabItem: {
    width: '100%',
    height: TAB_CONTENT_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    paddingBottom: 0,
  },
  tabSlot: {
    height: BAR_H,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: TAB_BOTTOM_OFFSET,
  },
  iconWrap: {
    width: 40, height: 32,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: calm.mintBg,
  },
  iconWrapActiveDark: {
    backgroundColor: darkPalette.primarySoft,
  },
  iconWrapInsights: {
    backgroundColor: calm.mintBg,
  },
  label: {
    fontFamily:   fonts.bodyBold,
    fontSize:     9,
    lineHeight:    12,
    height:        12,
    marginTop:     2,
    letterSpacing: 0,
    textAlign:     'center',
  },

  expandBtn: {
    width:          EXPAND_BTN_W,
    height:         BAR_H,
    alignItems:     'center',
    justifyContent: 'flex-end',
    paddingBottom:  TAB_BOTTOM_OFFSET,
  },
  expandBtnInner: {
    width: '100%',
    height: TAB_CONTENT_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLayer: {
    position: 'absolute',
    width: EXPAND_BTN_W,
    height: TAB_CONTENT_H,
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'absolute',
    right: 4,
    width: 20, height: BAR_H,
    justifyContent: 'center', alignItems: 'center',
    paddingBottom: TAB_BOTTOM_OFFSET,
  },
  settingsDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.inkFaint,
  },
});

