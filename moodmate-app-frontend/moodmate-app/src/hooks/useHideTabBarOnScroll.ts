import { useCallback, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTabVisibilityStore } from '@/state/useTabVisibilityStore';

const HIDE_DELTA = 18;
const SHOW_DELTA = 8;
const TOP_REVEAL_Y = 24;

export function useHideTabBarOnScroll() {
  const lastYRef = useRef(0);
  const accumulatedRef = useRef(0);
  const showTabBar = useTabVisibilityStore((s) => s.showTabBar);
  const hideTabBar = useTabVisibilityStore((s) => s.hideTabBar);

  return useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = y - lastYRef.current;
    lastYRef.current = y;

    if (y <= TOP_REVEAL_Y) {
      accumulatedRef.current = 0;
      showTabBar();
      return;
    }

    if (Math.abs(delta) < 1.5) return;

    const sameDirection =
      Math.sign(delta) === Math.sign(accumulatedRef.current) || accumulatedRef.current === 0;
    accumulatedRef.current = sameDirection ? accumulatedRef.current + delta : delta;

    if (accumulatedRef.current > HIDE_DELTA) {
      hideTabBar();
      accumulatedRef.current = 0;
    } else if (accumulatedRef.current < -SHOW_DELTA) {
      showTabBar();
      accumulatedRef.current = 0;
    }
  }, [hideTabBar, showTabBar]);
}
