# MoodMate — React Native (Expo + TypeScript) frontend

The full frontend build, ported screen-by-screen from the approved HTML/CSS/JS
prototype (`MoodMate_Headspace_Style_UI.html`). Tech stack matches the original
proposal: **React Native + Expo + TypeScript**. The backend (Spring Boot +
PostgreSQL microservices) is a separate build.

## Status: every screen is built and wired

`npx tsc --noEmit` passes with **zero errors** across all 37 source files, and
every screen in the prototype now has a real React Native implementation —
nothing is a placeholder anymore.

**Entry flow:** Splash (animated logo, auto-advance, tap-to-skip) → Login /
Signup (real validation: disabled-until-valid buttons, password mismatch
detection, show/hide toggle) → Main tabs.

**Tabs:** Home (streak, Wellness Tree card, daily goals, quick actions, AI
insight → Pro), Journal (calendar strip, templates, notebook entries),
Explore (breathing hero, daily-calm sessions, Wellness Hub, Calm Match,
soundscape grid, challenge/exam-hub teasers), Community (Campus
Voices/PeerConnect toggle, topic chips, live-reaction posts, mentor
spotlight), Support (appointment card, peer mentors, messages).

**Modals:** Check-in (emotion wheel + sliders + save → tree XP), Wellness Tree
(shares live state with Home), Gratitude Jar, Breathing Session (real
phase-cycling animation: Breathe in 4s → Hold 2s → Breathe out 5s, looped),
SOS (always free, never gated), Profile (live streak/tree-level/leaf balance),
Pro (feature checklist + monthly/yearly toggle), Tree Shop (real skin
purchases, boosts, leaf packs — wired to global state), Wellness Hub
(Articles/Events toggle, live RSVP), Calm Match (full flip/match game logic,
rewards tree XP on a win).

## Architecture

```
App.tsx                      → providers + NavigationContainer + ToastHost
src/
  theme/tokens.ts             → colors/spacing/radii/type, ported 1:1 from the prototype's CSS variables
  state/
    useAppState.ts            → global Zustand store: treeXP, streakCount, goals, leafBalance, treeSkin
    useToast.ts                → global toast store (mirrors showToast() in the prototype)
  components/
    Button, Card, Chip, ProgressBar, TextField, ScreenHeader, ToggleCards,
    EmotionWheel, Confetti (imperative burst), ToastHost, PlaceholderScreen
  navigation/
    types.ts                   → typed param lists for the tab navigator + root stack
    MainTabs.tsx                → bottom tabs: Home, Journal, Explore, Community, Support
    RootNavigator.tsx           → Splash → Login/Signup → Main, + modal-presented overlays
  screens/
    SplashScreen.tsx
    auth/LoginScreen.tsx, SignupScreen.tsx
    home/HomeScreen.tsx, GoalRow.tsx
    journal/JournalScreen.tsx
    explore/ExploreScreen.tsx
    community/CommunityScreen.tsx
    support/SupportScreen.tsx
    modals/   → CheckIn, WellnessTree, GratitudeJar, BreathingSession, SOS,
                 Profile, Pro, Shop, Hub, Game
```

**State management:** Zustand. `useAppState()` is the single source of truth
for tree XP, streak, daily goals, leaf currency, and the equipped tree skin —
any screen that needs them just calls the hook, so Home and Wellness Tree
(and the Shop) always agree with each other. `useToast()` is a second, tiny
store purely for the toast pill, kept separate so screens don't need a
provider — just call the hook.

**Navigation:** React Navigation (native-stack + bottom-tabs). Prototype
overlays are modal-presented stack screens (`presentation: 'modal'`).

**Animation:** React Native's built-in `Animated` API throughout — button
press-scale, checkbox bounce + floating XP text, confetti bursts, tree sway,
animated progress-bar fills, the breathing ring's per-phase scale animation,
and shake-on-insufficient-funds in the Tree Shop and Calm Match mismatches.
No extra native animation library needed.

## Safe-area / status-bar overflow fix — rollout status

**Root cause:** Android now enforces edge-to-edge rendering by default, and
every screen here uses `headerShown: false` (no native header left to absorb
the inset automatically). Content was rendering right under the status bar.

**The fix:** `src/components/Screen.tsx` — a wrapper using
`useSafeAreaInsets()` that pads content by the device's real inset while
letting the background bleed full-screen behind the status bar (no hard
color seam). It owns `paddingTop`/`paddingBottom` exclusively by design —
screens pass `extraTopGap`/`extraBottomGap` for cosmetic spacing instead of
setting padding directly, which structurally prevents a screen's own styles
from silently overriding the inset (a real bug I caught and fixed mid-build —
see commit history in this conversation if you're curious, or just trust the
verification below).

**Migrated so far (Phase 1 — verified):** Splash, Login, Signup, Home,
Wellness Tree.

**Not yet migrated (Phase 2 — same overflow bug still present):** Journal,
Explore, Community, Support, and the Check-in / Gratitude Jar / Breathing
Session / SOS / Profile / Pro / Tree Shop / Hub / Game modals. These still
use the old plain `ScrollView`/`View` pattern. Migrating them is mechanical
— swap the outer `ScrollView` for `<Screen>`, remove any `padding`/
`paddingTop`/`paddingBottom` from that screen's own `content` style, done.
Doing this in another batch of ~5, verified the same way (`tsc --noEmit` +
real `expo export` bundle), is the next step — deliberately not done all at
once in this pass, to keep risk contained per screen-batch.


## What I verified (not just "should compile")

- `npx tsc --noEmit` — 0 errors, all 37 files, including every screen.
- Caught and fixed 2 real type errors along the way (an invalid `pointerEvents`
  prop on `Animated.Text`, and an under-inferred `useState` literal type in
  the breathing-phase state) — both would have been runtime/logic bugs.
- Compiled `useAppState.ts` standalone to CommonJS and ran it directly in
  Node, replaying the exact same goal-completion sequence tested against the
  HTML prototype: toggling all 3 daily goals correctly raises tree XP *and*
  increments the streak only on the 3rd completion; unchecking a goal doesn't
  undo the streak; insufficient-funds tree-skin purchases are correctly
  rejected with no state mutation; leaf spend/earn never underflows.
- After the SDK 51→54 upgrade: re-ran `tsc --noEmit` (0 errors) **and** ran
  `npx expo export --platform android`, which actually bundled all 879
  modules into a real Hermes bytecode file — proof the app builds end to
  end, not just type-checks.
- After the Phase-1 safe-area migration: re-ran both checks again (880
  modules now, +1 for the new `Screen` component), plus the state-store
  regression test one more time. All still pass.

## ⚠️ Expo Go SDK version — read this if you hit "Failed to download remote update"

**This project targets Expo SDK 54.** Expo Go only supports one SDK version at a
time (the one matching the Expo Go app itself) — if your Expo Go app is on a
different SDK than the project, you'll get exactly this error:
`Uncaught Error: java.io.IOException: Failed to download remote update`

It looks like a network problem but it usually isn't — it's a version
mismatch. Check your Expo Go SDK version (Profile tab → scroll down) and make
sure it matches `"expo": "~54.0.0"` in `package.json`. If Expo Go updates
itself to a newer SDK later, this project will need bumping too — see "Ways
to run this on your phone" below for an option that sidesteps this problem
entirely (a standalone build).

I verified this version set two ways, not just by checking it compiles:
1. `npx tsc --noEmit` — 0 errors against React 19 / React Native 0.81 / React
   Navigation v7.
2. `npx expo export --platform android` — Metro actually bundled all 879
   modules into a real Hermes bytecode bundle (the literal artifact Expo Go
   downloads and runs) with zero build errors. This is the same step that
   was failing before — confirmed it now succeeds end-to-end, not just
   type-checks.

I also caught a second real issue while doing this: `babel-preset-expo` isn't
transitively resolvable at SDK 54 the way it was at 51, so I added it as an
explicit `devDependency` — without that fix, you'd have hit a *different*
bundling error right after the SDK mismatch was resolved.

## Ways to run this on your phone

In order of how fast/reliable each is for this kind of project:

**1. Expo Go, same Wi-Fi network (fastest, what most people use)**
```bash
npm install
npm start
```
Scan the QR code with Expo Go. Phone and computer must be on the *same*
Wi-Fi — this fails on networks that isolate devices from each other (common
on campus/office/guest Wi-Fi).

**2. Expo Go, tunnel mode (when phone & computer can't share a network)**
```bash
npx expo start --tunnel
```
Slower (routes through a relay), but works across different networks/mobile
data. If the tunnel itself fails, try `npm install -g @expo/ngrok` first.

**3. Standalone preview build via EAS (most "assured" — no Expo Go needed at all)**
This sidesteps SDK-matching entirely, since the build contains its own JS —
nothing to download at runtime.
```bash
npm install -g eas-cli
eas login          # free Expo account
eas build:configure
eas build -p android --profile preview
```
EAS builds it on Expo's servers and gives you a link to download an `.apk`
directly to your phone (Android: just open the link and install; you may
need to allow "install from unknown sources" once). For iOS this needs a
paid Apple developer account to install outside the App Store/TestFlight, so
it's an Android-first option unless you have that.

**4. Local native build with USB (most control, most setup)**
Requires Android Studio (Android) or Xcode (iOS, Mac only) installed:
```bash
npx expo run:android   # phone connected via USB with USB debugging on
npx expo run:ios        # Mac + Xcode + cable, or a simulator
```
This builds a real native app directly from your machine — no Expo Go, no
SDK-matching concern, works offline once dependencies are installed.

**5. Web preview (not your phone, but useful for a fast visual check)**
```bash
npx expo start --web
```
Good for sanity-checking screens quickly on a laptop before touching a
device at all — some native-only bits (the slider, certain animations) may
render slightly differently than on a real phone.


## ⚠️ One thing I still couldn't do in this environment

The design tokens reference `'Baloo2-Bold'` / DM Sans to match the prototype's
fonts exactly, but this sandbox has no network access to Google Fonts, so the
`.ttf` files aren't bundled. The app **runs fine** without them — React
Native silently falls back to the system font when a `fontFamily` isn't
loaded — it just won't visually match until someone:

1. Downloads Baloo 2 (SemiBold/Bold) and DM Sans (Regular/Medium/Bold) from
   Google Fonts
2. Drops the `.ttf` files in `assets/fonts/`
3. Loads them in `App.tsx` with `expo-font`'s `useFonts()` — the exact code
   is already commented in `App.tsx`, just uncomment and add the files

## Quick start

```bash
npm install
npm run typecheck   # tsc --noEmit — should report 0 errors
npm start
```
Then see "Ways to run this on your phone" above for how to actually open it on a device.

## Known simplifications (intentional, frontend-only stage)
- All data is in-memory (Zustand) — nothing persists across app restarts yet.
  That's expected: persistence is the backend's job (Spring Boot + Postgres),
  not the frontend's, and is the natural next phase after this.
- Journal entries, messages, and mentor lists are static display data, not
  wired to a real list/CRUD yet — same reasoning.
- `PlaceholderScreen.tsx` is no longer used by any screen but is left in
  `components/` since it's a handy pattern if you add a new screen before its
  real content is ready.

## Suggested next steps, in order
1. Add the real fonts (above) — fastest visual win, makes every screen match the prototype exactly.
2. Wire up the Spring Boot services in parallel — the entity shapes are already in the original proposal, and the frontend's `useAppState` shape maps cleanly onto a `/wellness-progress` endpoint.
3. Replace in-memory state with real API calls + persisted auth (JWT) once the backend exists.
4. Add the actual breathing/meditation audio (expo-av) to the Breathing Session and Explore's soundscape tiles — currently silent.
