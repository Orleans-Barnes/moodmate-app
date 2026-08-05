# MoodMate — Project Context for Claude Code

Read this fully before doing anything. It carries over everything already
decided/built/verified in prior work on this project, so you don't repeat
decisions or break things that are already known to work.

## What this is

MoodMate: a student mental wellness app (mood tracking, journaling, AI
insights, peer support, professional counselling, gamified wellness habits)
built for a hackathon (CodeQuest@26), originally scoped for KNUST students.
This repo is the **frontend only** — React Native + Expo + TypeScript. A
separate Spring Boot + PostgreSQL microservices backend is planned but not
started; right now all state is in-memory (Zustand), which is intentional,
not a bug.

The UI/UX direction is **Headspace-calm visuals + Duolingo-style gamified
feedback** (confetti, streaks, floating XP, animated progress bars) — this
was deliberately chosen over a generic/corporate look. Preserve that tone in
anything new.

## Tech stack (confirmed working, don't downgrade without a reason)

- Expo SDK **54** (`expo: ~54.0.0`) — must match whatever SDK the developer's
  Expo Go app supports. If Expo Go ever reports a different SDK, that's a
  real compatibility wall, not a network bug — see "Lessons learned" below.
- React 19.1.0 / React Native 0.81.5
- React Navigation **v7** (native-stack + bottom-tabs)
- Zustand for global state (not Redux/Context — kept deliberately tiny)
- TypeScript strict mode

## Architecture

```
App.tsx                      → providers + NavigationContainer + ToastHost
src/
  theme/tokens.ts             → colors/spacing/radii/type — the ONLY source of styling values
  state/
    useAppState.ts            → global store: treeXP, streakCount, goals, leafBalance, treeSkin
    useToast.ts                → global toast store
  components/                  → Button, Card, Chip, ProgressBar, TextField, ScreenHeader,
                                  ToggleCards, EmotionWheel, Confetti, ToastHost, PlaceholderScreen
  navigation/
    types.ts                   → typed param lists (tab navigator + root stack)
    MainTabs.tsx, RootNavigator.tsx
  screens/
    SplashScreen.tsx
    auth/LoginScreen.tsx, SignupScreen.tsx
    home/HomeScreen.tsx, GoalRow.tsx
    journal/ explore/ community/ support/   → tab screens
    modals/   → CheckIn, WellnessTree, GratitudeJar, BreathingSession, SOS,
                 Profile, Pro, Shop, Hub, Game
```

All 17 screens from the approved design are fully built (not placeholders).

## House rules — follow these, they're not optional

1. **Never hardcode a color, spacing value, or font.** Always import from
   `src/theme/tokens.ts`. If a value you need isn't in there, add it to
   tokens.ts first, then use it — don't inline a hex code or a raw number.
2. **Global state goes through `useAppState()` / `useToast()`.** Don't add a
   second state system or duplicate state locally that should be shared
   (e.g. tree XP, streak, leaf balance must always come from the one store).
3. **Verify before calling anything done — every time, no exceptions:**
   ```bash
   npm run typecheck                                              # tsc --noEmit — must be 0 errors
   npx expo export --platform android --output-dir /tmp/export-test   # must actually succeed
   rm -rf /tmp/export-test                                        # clean up after
   ```
   `tsc` passing is necessary but not sufficient — the export step is what
   actually proves Metro can bundle it, which is what caught a real
   `babel-preset-expo` resolution bug that `tsc` alone missed.
4. **Commit before starting a multi-file change.** This project doesn't have
   a remote — just `git add -A && git commit -m "..."` locally before any
   change that touches more than 1-2 files, so it's revertable.
5. **Don't touch SOS, crisis resources, or basic mood tracking to put them
   behind Pro.** This is a firm product/ethics rule, not a style preference
   — those must always stay free.

## Lessons learned (so you don't rediscover these the hard way)

- **"Failed to download remote update" / `java.io.IOException` in Expo Go**
  is almost always an SDK version mismatch between the project and the
  installed Expo Go app, not a network problem — Expo Go only supports one
  SDK at a time. Check `expo.version` in `package.json` against what Expo Go
  reports (Profile tab in the app).
- **`npx expo install --fix` doesn't work in fully offline/restricted
  network environments** (it calls Expo's API). If that ever fails, read
  `node_modules/expo/bundledNativeModules.json` directly instead — it ships
  inside the `expo` package itself and lists the exact compatible versions
  for every Expo-maintained library, no network needed.
- **`babel-preset-expo` is not always transitively resolvable** after an SDK
  bump — keep it as an explicit `devDependency` matching the SDK version.

## Current task: Safe-area-insets fix (do this next)

**Problem:** every screen currently pads its root container with a fixed
pixel value (`spacing.lg`, 16px) instead of the device's actual safe-area
insets. This overflows under/behind the status bar on real devices. Partly
this is just an under-specified value; partly it's a real platform change —
Android 15 made edge-to-edge rendering mandatory, so app content now draws
behind system bars by default and must explicitly pad around them.

**The plan (don't deviate without a good reason — this was chosen
specifically to avoid a screen-by-screen patch job that drifts out of sync
over time):**

1. Build **one** reusable component: `src/components/Screen.tsx`.
   - Uses `useSafeAreaInsets()` from `react-native-safe-area-context`
     (already installed) to get the real device insets.
   - Accepts an `edges` prop (e.g. `['top']`, `['top', 'bottom']`) so a
     screen can opt out of an edge it doesn't need — tab screens generally
     only need `top` since the tab bar already reserves the bottom; modal
     screens generally need both `top` and `bottom`.
   - Supports both the "scrollable content" shape (most screens) and the
     "fixed flex, centered content" shape (BreathingSessionScreen,
     SOSScreen, GameScreen).
2. Swap every screen's root container to use `<Screen>` instead of its
   current raw `View`/`ScrollView`. This should be a mechanical, same-shape
   edit repeated across all 17 screens — only the outer container changes,
   not the content inside it. If you find yourself redesigning a screen's
   content while doing this, stop — that's scope creep, not the task.
3. Double-check (don't assume) how `presentation: 'modal'` screens and the
   bottom-tabs bar handle insets on Android specifically — verify rather
   than take it on faith.
4. Run the verification steps above.
5. Add a short note to `README.md` documenting `<Screen>` as the standing
   convention, so anyone adding a new screen later uses it by default.

## Known simplifications (intentional — don't treat these as bugs to fix unprompted)

- All state is in-memory; nothing persists across app restarts. Persistence
  is backend work, not frontend work, and comes after this phase.
- Journal entries, messages, and mentor lists are static display data, not
  real lists yet.
- Fonts (`Baloo2-Bold`/`DMSans-*`) referenced in `tokens.ts` aren't bundled
  yet — falls back to system font silently, no crash. Instructions for
  adding the real `.ttf` files are commented in `App.tsx`.

## Verified-working logic — do not regress this

`src/state/useAppState.ts`'s `toggleGoal` has been explicitly tested
(compiled standalone and run in Node, multiple times across changes):
completing all 3 daily goals raises `treeXP` by each goal's xp value AND
increments `streakCount` by exactly 1, only on the 3rd completion — not
per-goal. Unchecking a goal afterward does not undo the streak. `setTreeSkin`
correctly rejects a purchase costing more than `leafBalance` with no state
mutation. If you touch this file, re-verify this exact behavior before
moving on.
