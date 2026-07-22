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
 */
export function useKeyboardOffset(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
