import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * Live on-screen-keyboard overlap height, driven directly by the OS keyboard show/hide events
 * rather than KeyboardAvoidingView's 'height'/'padding' 'behavior' prop.
 *
 * Why this exists: the chat screens (ChatScreen, CounsellorChatScreen, MentorChatScreen,
 * AIChatScreen) each had their composer stuck behind the keyboard instead of rising above it. The
 * root cause is that this app relies on Expo Go for local testing (see run_expo.bat / `npx expo
 * start`), and Android's `windowSoftInputMode="adjustResize"` - which app.json requests via
 * `expo.android.softwareKeyboardLayoutMode: "resize"` - is a native AndroidManifest setting that
 * ONLY takes effect in a custom dev/EAS build. Expo Go ships its own fixed manifest, so that
 * setting is silently ignored there, meaning nothing resizes the window on Android.
 *
 * First attempt here used `e.endCoordinates.height` directly, then tried subtracting
 * `useSafeAreaInsets().bottom` to compensate for Expo SDK 54's mandatory Android edge-to-edge mode
 * - both left a visible gap (in one direction or the other) between the composer and the
 * keyboard's real top edge, because guessing at how much of the reported height overlaps the nav
 * bar is fragile and device-dependent.
 *
 * This version instead computes the overlap geometrically: `endCoordinates.screenY` is the
 * keyboard's top edge, reported in "screen" coordinates - `Dimensions.get('screen')`, NOT
 * `Dimensions.get('window')`. Those two differ on Android (window can exclude system chrome even
 * in edge-to-edge mode); comparing screenY against 'window' silently under-counted the overlap,
 * which is what let the keyboard actually cover the bottom of the composer on an Android phone.
 * Matching the coordinate space gives the *exact* covered height with no guessing involved,
 * regardless of nav bar height, edge-to-edge mode, or status bar translucency - if the keyboard
 * visually starts at y=1400 and the screen is 2400px tall, it covers exactly 1000px, full stop.
 */
export function useKeyboardOffset(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      const screenY = e.endCoordinates?.screenY;
      if (typeof screenY === 'number') {
        const screenHeight = Dimensions.get('screen').height;
        setHeight(Math.max(0, screenHeight - screenY));
      } else {
        // Defensive fallback - screenY should always be present, but if some device/RN version
        // ever omits it, fall back to the (less reliable) reported height rather than 0.
        setHeight(e.endCoordinates?.height ?? 0);
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
