import React, { ReactNode } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  backgroundColor: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Which edges to pad by the device's real inset. Defaults to both. */
  edges?: { top?: boolean; bottom?: boolean };
  /**
   * Extra breathing room added ON TOP of the real inset (purely cosmetic,
   * not part of the overlap fix itself). Defaults to a small gap.
   */
  extraTopGap?: number;
  extraBottomGap?: number;
  /**
   * Optional pull-to-refresh. Only pass these on screens that have a real
   * fetch to re-run — wiring this to a no-op would just train users to
   * distrust the gesture.
   */
  refreshing?: boolean;
  onRefresh?: () => void;
  refreshTintColor?: string;
}

/**
 * Standard scrollable screen wrapper.
 *
 * Why this exists: Android now enforces edge-to-edge rendering by default,
 * and every screen in this app uses `headerShown: false` (no native header
 * left to silently absorb the status-bar/notch inset). Without this,
 * content renders right under the status bar — exactly the overflow bug
 * reported on-device.
 *
 * How it fixes it: pads *content* by the real device inset via
 * useSafeAreaInsets(), while the background color still extends full-bleed
 * behind the status bar — so there's no hard color seam, just correctly
 * positioned content.
 *
 * IMPORTANT — Screen owns `paddingTop` / `paddingBottom` exclusively.
 * `contentContainerStyle` passed in here must NEVER set `paddingTop`,
 * `paddingBottom`, or the bare `padding` shorthand (which implicitly sets
 * both) — those would be merged in *after* this component's own inset
 * styles and silently override them, undoing the fix. Use
 * `paddingHorizontal` for horizontal spacing, and the `extraTopGap` /
 * `extraBottomGap` props for any extra cosmetic spacing beyond the real
 * inset. This is the one rule every future screen migration needs to
 * follow — the prop names exist specifically so there's never a reason to
 * reach for paddingTop/paddingBottom directly in a screen's own styles.
 *
 * Use this for the common case: a screen whose root is a scrollable View.
 * Screens with a non-standard root (e.g. a Pressable covering the whole
 * screen, like Splash) should call useSafeAreaInsets() directly instead —
 * forcing every screen into this exact shape would be the wrong trade-off.
 */
export function Screen({
  children,
  backgroundColor,
  contentContainerStyle,
  edges = { top: true, bottom: true },
  extraTopGap = 8,
  extraBottomGap = 32,
  refreshing,
  onRefresh,
  refreshTintColor,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { backgroundColor }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          {
            paddingTop: (edges.top ? insets.top : 0) + extraTopGap,
            paddingBottom: (edges.bottom ? insets.bottom : 0) + extraBottomGap,
          },
          contentContainerStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={refreshTintColor}
              colors={refreshTintColor ? [refreshTintColor] : undefined}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
