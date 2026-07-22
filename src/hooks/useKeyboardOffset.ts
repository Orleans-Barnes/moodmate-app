import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * Live on-screen-keyboard height, driven directly by the OS keyboard show/hide events rather than
 * KeyboardAvoidingView's 'height'/'padding' 'behavior' prop.
 *
 * Why this exists: the three chat screens (ChatScreen, CounsellorChatScreen, AIChatScreen) each
 * had their composer stuck behind the keyboard instead of rising above it. The root cause is that
 * this app relies on Expo Go for local testing (see run_expo.bat / `npx expo start`), and Android's
 * `windowSoftInputMode="adjustResize"` - which app.json requests via
 * `expo.android.softwareKeyboardLayoutMode: "resize"` - is a native AndroidManifest setting that
 * ONLY takes effect in a custom dev/EAS build. Expo Go ships its own fixed manifest, so that
 * setting is silently ignored there, meaning nothing resizes the window on Android and
 * `behavior={undefined}` (what two of these screens used) does nothing. `behavior="height"` (what
 * the third screen used) is closer, but still depends on KeyboardAvoidingView correctly measuring
 * its own on-screen layout, which is fragile once a translucent status bar or nested flex
 * containers are involved.
 *
 * Reading the raw Keyboard events and applying the height as explicit padding sidesteps all of
 * that - it works identically on iOS and Android, in Expo Go and in a native build, regardless of
 * status bar mode.
 *
 * @param androidNavBarInset On Android, this app runs under Expo SDK 54's mandatory edge-to-edge
 * mode, so content is drawn behind the system navigation bar and `useSafeAreaInsets().bottom`
 * reports its height. The keyboard's own reported height (`endCoordinates.height`) spans all the
 * way to the true bottom of the display - but the keyboard itself doesn't actually overlap the
 * nav bar, it sits just above it. Without subtracting the nav bar's height back out, the reserved
 * space above the keyboard ends up too tall, leaving a visible gap between the composer and the
 * keyboard's real top edge instead of sitting flush against it. Pass `insets.bottom` from the
 * caller; ignored on iOS, where the reported height is already exact.
 */
export function useKeyboardOffset(androidNavBarInset: number = 0): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      const raw = e.endCoordinates?.height ?? 0;
      const corrected = Platform.OS === 'android' ? Math.max(0, raw - androidNavBarInset) : raw;
      setHeight(corrected);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [androidNavBarInset]);

  return height;
}
