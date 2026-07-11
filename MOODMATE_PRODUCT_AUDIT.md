# MoodMate — Full Product Audit
**Date:** 2026-07-03  
**Auditor role:** Chief Product Designer · Senior UX Researcher · Motion Designer · Brand Designer · Product Strategist · Senior Frontend Engineer  
**Status:** Awaiting approval before any implementation begins

---

## 1. Product Strategy

### What MoodMate is doing well
The core concept is strong. A mental wellness app purpose-built for students, layering mood tracking, journaling, breathing, community, and peer support into a single product. The feature surface is rich — 25+ screens, 15 Zustand stores, a full gamification system (XP, levels, badges, streaks, daily missions), and real API integrations for counsellors, appointments, and SOS resources. This is not a prototype — it's a real product.

### The core problem
**MoodMate is a feature catalogue, not an experience.** The pieces are there but they don't pull together into a coherent emotional journey. A student who opens the app in a low moment faces an overwhelming home screen with six competing UI layers before they can do anything. The one screen that matters most in a crisis — SOS — has broken buttons. The app's visual identity fractures across screens. The system works; the experience doesn't yet feel.

### Strategic positioning
To compete with Headspace, Calm, and Wysa, MoodMate's differentiator must be its **student-specific emotional intelligence** — not just another meditation timer, but the app that understands exam season, imposter syndrome, and 2am anxiety spirals. Every design decision should serve that positioning.

---

## 2. UX Reasoning — Identified Weaknesses

The following issues were derived from direct code inspection of all primary screens and the design token system.

---

### CRITICAL — Broken functionality

**SOS screen buttons are stubs (SOSScreen.tsx)**  
The "5-4-3-2-1 grounding" button calls `toast('Starting 5-4-3-2-1 grounding')` and goes nowhere. "Talk to a counsellor" calls `toast('Connecting you to a counsellor')` and goes nowhere. These are the two most important actions on the most important screen in the entire app. A student in crisis who taps either button and sees a toast popup has been failed by the product. This is a P0 issue — nothing else in this audit matters more.

**Why it reduces usability:** Crisis features that silently fail erode the foundational trust the app needs to be useful in the moments that count.

---

### HIGH — Core loop hierarchy (HomeScreen.tsx)

The home screen stacks six distinct UI layers vertically: greeting + streak stat + XP bar (XPBar) + badge shelf (BadgeShelf) + daily mission card (DailyMissionCard) + goal rows + micro nudge. The four quick action cards — Breathe, Journal, Explore, Check in — are displayed with equal visual weight as `QUICK_ACTIONS`, despite "Check in" being the single action that drives every other system (streaks, XP, mood gate, counsellor matching). A student scanning the screen has no clear "do this first" signal.

Additionally, the `QUICK_ACTIONS` array places "Check in" fourth (index 3), so it renders last on the right. Given left-to-right reading and natural thumb reach zones on a phone, the primary action is in the least discoverable position.

**Why it reduces usability:** Users in a low mood have reduced cognitive capacity. More decisions = less likely to act. The home screen currently asks users to choose between six competing visual layers before they've done anything.

---

### HIGH — Dual redundancy on Check-In screen (CheckInScreen.tsx)

The check-in screen has both a quick mood picker (6 emoji chips) and a full EmotionWheel, connected to the same `selected` state. The section label reads "Or explore emotions" — implying users should pick one or the other. But both inputs set the same value. A user who picks "Happy" from the chips and then taps a different sector on the wheel silently overwrites their first selection with no feedback.

The sliderTick labels (the bottom scale labels on the Stress and Energy sliders) are hardcoded `fontSize: 9` — below every accessibility standard. At 10+ feet of viewing distance on a phone, these are effectively invisible to any user with less than perfect vision.

**Why it reduces usability:** Redundant inputs with no clear hierarchy create decision paralysis. The 9px tick labels are inaccessible to a meaningful portion of users (WCAG requires 14px minimum for body text, 18px+ for paragraph text).

---

### HIGH — Brand incoherence (ExploreScreen.tsx)

The Explore screen uses a cold dark gradient (`#1A1A2E → #2D2D44 → #3D3D5C`) for its header — a completely different visual language from every other screen. The home screen uses warm coral → purple. Check-In uses warm coral. Journal uses warm teal. Explore feels like opening a different app. The color tokens system has defined gradients (see `gradients.dark`, `gradients.darkRich`) but Explore uses hardcoded hex values not from the token system at all.

The `gameSub` style — the subtitle text on each stress relief tool card — is `fontSize: 9`. This is below the token system's own minimum (`fontSizes.xs: 10.5`). "Guided visualization" and "Celebrate your wins" are literally unreadable on most phones at this size.

**Why it reduces usability:** Visual consistency is how users build mental models of an app. When screens look and feel different, users can't build trust or familiarity. The 9px text fails basic legibility.

---

### HIGH — Explore screen information architecture (ExploreScreen.tsx)

Music, Mindfulness sessions, Stress relief tools, and Desk stretch break are all stacked in one long, undifferentiated scroll with no tab navigation, no section anchors, and no way to jump between categories. A student who wants to do a breathing session has to scroll past the music player and its timer chips to find Mindfulness sessions. A student who wants to play Bubble Pop has to scroll past all of that.

The 3-column game grid is too narrow for readable text. "Proud Dandelion" in a ~100px wide column truncates on most devices. The grid also has uneven layout logic — 6 items in a `flexDirection: 'row'` with no wrapping means overflow on smaller screens.

**Why it reduces usability:** A screen that is everything is effectively nothing. Users can't form a mental model of what "Explore" is when it mixes music streaming, meditation, mini-games, and stretching with no navigational structure.

---

### MEDIUM — Accessibility gaps (all screens)

No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` props are present in any reviewed screen (HomeScreen, CheckInScreen, ExploreScreen, SOSScreen, BreathingSessionScreen, JournalScreen, CommunityScreen). VoiceOver/TalkBack users cannot use this app at all in its current state.

Touch target sizes:
- Timer chips in Explore: `paddingVertical: 4` — creates a ~28px tap target, below the 44pt iOS minimum
- "Stop" music button: `paddingVertical: 5` — same issue
- Close buttons across modals are 34×34px which is borderline

The app is locked to light mode (`"userInterfaceStyle": "light"` in app.json) with no dark mode support. This is a conscious choice but should be explicitly noted for student users who use their phones in dark environments (studying at night).

**Why it reduces usability:** Students with visual or motor impairments, and any user using assistive technology, cannot access the product at all. This is also an App Store guideline issue.

---

### MEDIUM — Motion and transition quality

The `springs` and `timing` constants defined in the token system (fast, bounce, gentle, nav) are almost entirely unused. Most animations use raw hardcoded values: `speed: 60, bounciness: 0` for button presses, `friction: 4` for the save button spring in CheckIn. The token system's spring presets are never referenced.

The breathing session screen's phase transition changes the background gradient color per phase but React Native's LinearGradient does not interpolate between gradient sets — so the transition between phases is a hard cut rather than a smooth blend.

The MoodGate fires 600ms after the main tab navigator mounts, with no fade-in animation. It appears abruptly.

**Why it reduces usability:** For a wellness app, motion is not decoration — it communicates calm, care, and intentionality. Hard cuts and inconsistent timing undermine the emotional quality of the experience.

---

### MEDIUM — Support screen has hardcoded time slots (SupportScreen.tsx)

The appointment booking time slots are `const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00']` — hardcoded in the component, not fetched from the API or derived from counsellor availability. Every counsellor appears to have the same 5 fixed slots regardless of their real schedule.

**Why it reduces usability:** Students booking counsellor appointments need accurate availability. Hardcoded slots that don't reflect real availability will lead to booking failures and eroded trust.

---

### LOW — SOS screen visual design (SOSScreen.tsx)

The SOS screen background is `colors.bg` — the warm cream (`#FAF7F2`) used throughout the app. A crisis intervention screen should communicate immediate calm and safety, not feel like a regular screen. The breathing ring is 128px — too small to be the visual anchor for someone in distress. The ring pulse is subtle (scale 1→1.06) — on a crisis screen, the breathing guide needs to be unmissable.

**Why it reduces usability:** A student in acute distress has tunnel vision. The screen needs to do one thing clearly — guide them to breathe — and the current design is too quiet for that moment.

---

### LOW — Stretch timer memory leak risk (ExploreScreen.tsx)

The `startStretch()` function sets `stretchTimer.current = setInterval(...)`. The cleanup `clearInterval(stretchTimer.current!)` only runs when the stretch sequence completes (`next >= STRETCH_STEPS.length`). If a user navigates away from the Explore tab mid-stretch, the interval is not cleared. The component will continue calling `setStretchStep` and `setStretchSecsLeft` on an unmounted component, producing React warnings and a potential memory leak.

**Why it reduces usability:** Invisible but causes console errors and could contribute to performance degradation over long sessions.

---

### LOW — Missing splash asset (app.json)

`app.json` references `"./assets/splash.png"` but the assets directory only contains `music/` and `sounds/` subdirectories. Metro logs a warning on every startup. This has no runtime impact but produces noise in the log and will cause issues in production builds.

---

## 3. Design Reasoning

### Visual identity assessment
The design token system is thoughtful and well-structured. Baloo2 (display) + DM Sans (body) is an excellent pairing — warm and playful for headings, clean and readable for content. The color palette (coral / sage / lavender / blue / sun) is distinct and emotionally appropriate for a wellness product targeting students.

The implementation diverges from the system too often. Several screens use hardcoded hex values for gradients and colors that have clear equivalents in the token file. This isn't a design problem — it's a discipline problem that can be resolved with a systematic cleanup pass.

The glassmorphism approach (GlassView + DarkGlassView) is well-implemented and gives the app its signature premium feel. This should be used more consistently, especially on the SOS screen and Explore header.

### Typography hierarchy
The scale is well-defined but the bottom end is too small. `fontSizes.xs: 10.5` is used for tag labels, slider ticks, timer chips, and secondary text throughout. The addition of `gameSub: 9` as a hardcoded value in ExploreScreen bypasses the token system entirely. A revised minimum floor of 12px (`fontSizes.sm`) for all secondary/helper text would resolve most legibility issues without redesigning anything.

---

## 4. Wireframe Concepts

### Home Screen — Redesigned hierarchy

```
┌─────────────────────────────────┐
│  GRADIENT HEADER (coral→purple) │
│  Good morning, [name] · Mon 3   │
│  🔥 4-day streak  ⭐ 340 XP    │
│                                 │
│  ┌─────────────────────────┐   │
│  │  HOW ARE YOU TODAY?     │   │  ← Primary CTA, full width
│  │  Log your mood  →       │   │    elevated, pulsing glow
│  └─────────────────────────┘   │
│                                 │
│  QUICK ACTIONS (3 cards)        │
│  [Journal] [Breathe] [Explore]  │  ← Secondary, smaller
└─────────────────────────────────┘
│  TODAY'S MISSION                │  ← Collapsible card
│  Daily goals (2/3)              │
│  Badge shelf                    │
└─────────────────────────────────┘
```

Check In becomes the single dominant visual element at the top. The three secondary actions beneath it are genuinely secondary. Gamification layers collapse into a single "Progress" card that expands on tap rather than rendering all at once.

### Explore Screen — Tab navigation

```
┌─────────────────────────────────┐
│  EXPLORE  (warm gradient header)│
│  ┌──────┬──────────┬──────────┐ │
│  │🎵    │🧘        │🎮        │ │  ← Pill tabs
│  │Music │Mindful   │Activities│ │
│  └──────┴──────────┴──────────┘ │
└─────────────────────────────────┘
│  [Tab content — single screen]  │
│  Music: full track list         │
│  Mindful: sessions + stretch    │
│  Activities: 2-col game grid    │
└─────────────────────────────────┘
```

### SOS Screen — Redesigned for crisis

```
┌─────────────────────────────────┐
│  DEEP BLUE background           │
│                                 │
│         ╭───────────╮           │
│         │           │           │  ← Large pulsing circle (200px)
│         │ Breathe   │           │     smooth 4s in/out cycle
│         │ with me   │           │
│         ╰───────────╯           │
│                                 │
│  You are safe. Follow the ring. │
└─────────────────────────────────┘
│  → 5-4-3-2-1 Grounding         │  ← Full-width, navigates for real
│  → Talk to someone              │  ← Full-width, navigates for real
│  → Call crisis line             │  ← From API
│                             ✕   │  ← Small close, bottom right
└─────────────────────────────────┘
```

---

## 5. Visual Hierarchy

**Priority order for the Home screen:**
1. Primary action: Check In CTA (largest, brand color, glowing)
2. Greeting + streak summary (supporting, inside header)
3. Secondary quick actions: Journal / Breathe / Explore (equal, smaller)
4. Progress & gamification (collapsed card, expandable)
5. Goals list (secondary scroll section)

**Priority order for the SOS screen:**
1. Breathing guide ring (dominant, >50% of screen area)
2. Reassurance text (large, centered)
3. Action buttons (full-width, clear hierarchy: grounding → counsellor → crisis line)
4. Close affordance (small, non-prominent, to the side — exiting should feel intentional not reflexive)

---

## 6. Motion Plan

### Phase 1 — Use the existing token system
All animations should reference `springs.fast`, `springs.bounce`, `springs.gentle`, and `springs.nav` from the token file. No hardcoded `friction` / `tension` / `speed` / `bounciness` values in any component.

### Phase 2 — Enhance key moments
- **Check-In save:** After saving, the button should morph into a success checkmark (scale + opacity transition) before navigating back. Currently it's just a toast.
- **Badge unlock:** The `newlyUnlockedBadge` in the gamification store triggers a confetti burst — this is good. Add a rising card animation underneath the confetti showing the badge details before it auto-dismisses.
- **Breathing session phase transition:** Animate the background gradient by using two overlapping LinearGradient layers, fading between them over 800ms when the phase changes rather than hard-cutting.
- **Explore tabs:** Tab switching should slide content horizontally (like a scroll view) rather than instantly replacing it.
- **SOS ring:** The pulse should use an `Animated.loop` with a 4-second cycle with `Easing.inOut(Easing.sin)` (matching the existing implementation) but scale should go 1.0 → 1.25 — more visible than the current 1.06.

### Phase 3 — Screen transitions
- Modals should enter from the bottom with a spring (already using `presentation: 'modal'` ✓).
- The SOS screen should use a fade transition (already set: `options={{ animation: 'fade' }}` ✓).
- The MoodGate entry delay (600ms timeout) should be removed — navigate synchronously and let the screen handle its own entry animation.

---

## 7. Accessibility Review

| Issue | Severity | Fix |
|-------|----------|-----|
| No accessibilityLabel on any interactive element | Critical | Add to all Pressable, TextInput, Slider |
| No accessibilityRole on buttons and headers | Critical | Add role="button", "header", "text" |
| gameSub = 9px in ExploreScreen | Critical | Minimum 12px (fontSizes.sm) |
| Slider tick labels at 9px | Critical | Minimum 12px |
| Timer chips: 4px vertical padding = ~28px target | High | Minimum 44px target (add minHeight: 44) |
| "Stop" music button: 5px vertical padding | High | Same |
| All screens: light mode only | Medium | Add dark mode color variants to token system |
| EmotionWheel: no accessible alternative | Medium | Add spoken label to each emotion sector |

---

## 8. Performance Considerations

**Stretch timer cleanup (Explore):** Add a `useEffect` return function that clears the interval when the component unmounts, independent of stretch completion. Currently only clears on sequence end.

**WaveformVisualizer:** Creates all 7 `Animated.Value` instances in `useRef` even when `barCount < 7`. Slice should happen at the `useRef` level: `BAR_CONFIGS.slice(0, barCount).map(() => new Animated.Value(0))`. Already done correctly — this is fine as-is.

**ExploreScreen re-renders:** The `affirmation` calculation runs on every render (derives from `Date.now()`). Wrap in `useMemo` with an empty dependency array to derive once.

**MoodGate setTimeout:** The 600ms `setTimeout` in `MainRouter.tsx` delays navigation to `MoodGate` and can cause a double render if the user navigates during that window. Remove the timeout; trigger synchronously or in a `useLayoutEffect`.

**SecureStore in Zustand persist:** All 15 stores use SecureStore for persistence. SecureStore is an async encrypted store — appropriate for auth tokens and sensitive wellness data. No performance concern here.

---

## 9. Component Architecture

### Components to create
- `PrimaryCheckinCTA` — the dominant home screen check-in card with pulse animation. Replaces the current grid position of "Check in" in QUICK_ACTIONS.
- `ExploreTabs` — a pill tab bar (Music | Mindful | Activities) with animated content switching. Replaces the single-scroll layout of ExploreScreen.
- `SOSRing` — a standalone breathing ring component with configurable size, cycle duration, and color. Extracts from SOSScreen for reuse in BreathingSessionScreen and SOS.
- `BadgeUnlockCard` — an animated rising card that displays newly unlocked badge details. Triggered by `newlyUnlockedBadge` in gamification store.

### Components to modify
- `QuickActionCard` (HomeScreen.tsx, inline): Extract to its own file. Currently defined inline in HomeScreen, making it hard to iterate independently.
- `WaveformVisualizer`: Already well-isolated. No structural change needed.
- `GlassView` / `DarkGlassView`: Already excellent. Should be used on SOS screen and consistently in Explore header.
- `ScreenHeader`: Review usage across all modal screens to ensure consistent close button placement and back-navigation behavior.

### Stores to update
- `useGamificationStore`: `shouldShowMoodGate()` is a derived function — no issue. No structural change needed.
- `useSupportStore`: Time slots should be fetched from API or derived from counsellor availability data, not hardcoded in the screen component.

---

## 10. Implementation Roadmap

Prioritized by user impact and implementation risk.

### Sprint 1 — Fix broken things (no design change required)
1. **SOS screen:** Wire "5-4-3-2-1 grounding" to `navigation.navigate('Grounding')` and "Talk to a counsellor" to `navigation.navigate('CounsellorChat', {...})` or `navigation.navigate('Support')`. This is 3 lines of code.
2. **Explore stretch timer:** Add `useEffect` cleanup to clear interval on unmount.
3. **Explore gameSub font size:** Change from hardcoded `9` to `fontSizes.sm` (12).
4. **Slider tick labels (CheckIn):** Change from hardcoded `9` to `fontSizes.xs` (10.5) minimum, ideally 12.
5. **MoodGate timeout:** Remove the 600ms `setTimeout`, navigate directly.

### Sprint 2 — Home screen hierarchy
6. Elevate Check In as primary CTA (full-width card at top of scroll, distinctive visual treatment)
7. Collapse gamification stack (XP bar + badge shelf + daily mission) into single expandable "Your Progress" card
8. Reorder QUICK_ACTIONS: Journal → Breathe → Explore (Check In moves to primary position above)

### Sprint 3 — Explore screen restructure
9. Add pill tab navigation (Music | Mindful | Activities) to Explore screen
10. Update Explore header gradient to match brand system (use `gradients.header` from tokens)
11. Fix game grid: move to 2-column layout for readability, or increase gameSub to minimum 12px and cap label at 2 lines

### Sprint 4 — SOS screen redesign
12. Deep blue background for SOS
13. Increase ring size to 200px, increase pulse scale to 1.0→1.25
14. Restructure layout (ring takes 50%+ of screen)

### Sprint 5 — Accessibility baseline
15. Add `accessibilityLabel` and `accessibilityRole` to all interactive elements across all primary screens
16. Fix touch target sizes to 44pt minimum
17. Audit and enforce minimum 12px font size on all body/secondary text

### Sprint 6 — Motion quality
18. Replace all hardcoded animation values with token-based spring presets
19. Implement breathing session gradient fade-between-phases
20. Implement check-in success state animation before navigate-back

### Sprint 7 — Hardcoded values cleanup
21. Replace all hardcoded hex values in ExploreScreen (GAMES array: `'#0D3B38'`, `'#2A7A72'`, `'#0A2540'`, etc.) with tokens
22. Add splash.png asset or remove splash config from app.json
23. Support screen: fetch appointment slots from API, not hardcoded array

---

## 11. Risks

**Refactoring risk:** Sprint 2 (home screen hierarchy) touches HomeScreen.tsx which is the most complex file in the project. Any regression here affects the first screen users see on every launch. Requires thorough testing of all animation paths (streakPulse, quick card presses, confetti burst, goal toggles).

**Navigation risk:** Wiring SOS grounding/counsellor buttons to real screens (Sprint 1) requires confirming `CounsellorChatScreen` and `GroundingScreen` can be entered without required route params or with sensible defaults. Needs a quick check of both screens' param types before wiring.

**API dependency:** Support screen time slots (Sprint 7) depends on the backend having a counsellor availability endpoint. If not, this requires both a backend route and a frontend change together.

**Accessibility sprint scope creep:** There are 25+ screens. Adding `accessibilityLabel` to every interactive element across the whole app is a large but mechanical task. It must be done comprehensively — partial accessibility is worse than none for users relying on screen readers (partial coverage breaks the navigation flow).

---

## 12. Testing Checklist

**Sprint 1 (P0 fixes):**
- [ ] Tap "5-4-3-2-1 grounding" on SOS → navigates to GroundingScreen
- [ ] Tap "Talk to a counsellor" on SOS → navigates to counsellor/support flow
- [ ] Navigate away from Explore mid-stretch → no React "unmounted component setState" warning in console
- [ ] gameSub text in Explore game grid → visible and readable on iPhone SE (smallest supported size)
- [ ] Slider tick text in CheckIn → visible at arm's length on device

**Sprint 2 (Home hierarchy):**
- [ ] First interaction for new user is Check In CTA (no scroll required to see it)
- [ ] Quick actions grid still navigates correctly (Breathe → BreathingSession, Journal → JournalEntry, Explore → tabs)
- [ ] Progress card collapses/expands without layout jump
- [ ] Streak pulse animation still runs (native driver only — must not conflict with any new layout animations)
- [ ] Guest user sees GuestProgressBanner, not XP bar

**Sprint 3 (Explore restructure):**
- [ ] Tab switching works on iOS and Android
- [ ] Music state (currentTrackId, isPlaying) persists when switching between Explore tabs
- [ ] Game grid wraps correctly on iPhone SE and iPad
- [ ] Explore header gradient matches Home header visually

**Sprint 4 (SOS redesign):**
- [ ] SOS screen accessible via navigation from home (no dead ends)
- [ ] Ring animation runs on older devices (Animated.loop with native driver)
- [ ] Crisis line buttons open device dialer (test on real device — simulator dialer behaves differently)
- [ ] Close button is visible but not the first thing the eye lands on

**Sprint 5 (Accessibility):**
- [ ] VoiceOver (iOS) reads all interactive elements with meaningful labels
- [ ] TalkBack (Android) equivalent
- [ ] All touch targets ≥ 44pt (verify with Accessibility Inspector in Xcode)
- [ ] No text below 12px anywhere in the app

**Sprint 6 (Motion):**
- [ ] Breathing session phase transitions are smooth fades, not hard cuts
- [ ] Check-in save: success animation plays before navigation
- [ ] All spring animations use token-based presets — grep for hardcoded `friction`/`tension`/`speed` to verify

**Regression (all sprints):**
- [ ] Expo bundler runs clean with no errors or warnings
- [ ] Metro cache cleared before each test run
- [ ] All 15 Zustand stores hydrate correctly on app relaunch
- [ ] Guest mode and authenticated mode flows both work end-to-end

---

## 13. Awaiting Approval

This audit is complete. No code has been changed.

Please review this document and confirm which sprints to prioritize. My recommendation is to start with **Sprint 1** immediately (P0 bug fixes — ~1 hour of work, highest user safety impact), then discuss the order of Sprints 2–7.

Once you approve, I will implement one sprint at a time, presenting each change before moving to the next.
