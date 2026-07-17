# MoodMate Frontend Implementation Plan v2.0
*Authored after full audit of codebase — July 2026*

---

## 0. Audit Summary

### Current frontend state
| Area | Status |
|------|--------|
| Stack | React Native 0.81.5 + Expo 54, TypeScript, React Navigation (stack + bottom tabs) |
| State | Zustand + expo-secure-store (well-structured, keep) |
| API layer | api/client.ts + api/auth.ts (clean, keep) |
| Design tokens | Wrong: Baloo2/DM Sans fonts, coral/sage palette, emojis everywhere |
| Missing packages | Reanimated, Gesture Handler, Expo Blur, React Native SVG, NativeWind, Lucide |
| Missing screens | Onboarding ×3, Role Select, Counsellor flow, Admin flow |
| Navigation gap | No Onboarding, no Role Select before Login |
| Glass/animation | Zero — none installed |

### Backend state (single Spring Boot monolith, not microservices)
Existing packages: `auth`, `checkin`, `community`, `gratitude`, `hub`, `sos`, `support`, `wallet`, `wellness`

Backend gaps identified (new endpoints/controllers needed):
- Gamification: XP events, achievements, daily missions, streak bonuses
- Admin: campus-wide analytics, flagged content moderation
- Counsellor: clinical notes, student mood history view (counsellor-scoped)
- Games: server-side session logging (client-side logic is fine; just needs leaf coin award endpoint)

---

## 1. Non-Negotiable Rules

1. **Never merge frontend commits to `backend` branch and vice versa.**
2. **Groq API key never in source code** — always `${GROQ_API_KEY}` from gitignored `start.bat`.
3. **No file or change without prior explanation** (per CLAUDE.md).
4. **Role Select screen appears BEFORE Login/Signup** in the navigation flow.
5. **No emojis anywhere** — Lucide React Native icons only.
6. **Quicksand font only** — no Baloo2, no DM Sans.
7. **60 FPS target** — all animations use Reanimated v3 (not Animated API).
8. **Reuse components** — never design the same pattern twice.

---

## 2. Package Changes

### Add to package.json
```
react-native-reanimated          ~3.x   (animations, liquid effects)
react-native-gesture-handler     ~2.x   (swipe, drag, press feedback)
expo-blur                        ~14.x  (frosted glass)
react-native-svg                 ~15.x  (tree, charts, emotion wheel)
nativewind                       ~4.x   (utility classes)
tailwindcss                      ^3.x   (NativeWind peer)
lucide-react-native              ^0.x   (all icons — replaces @expo/vector-icons)
@shopify/flash-list              ~1.x   (performant FlatList replacement)
react-native-linear-gradient     (already have expo-linear-gradient — keep)
expo-haptics                     ~14.x  (tactile feedback on interactions)
```

### Remove
```
@expo/vector-icons               (replaced by lucide-react-native)
@react-native-community/slider   (will use custom Reanimated slider)
```

---

## 3. Folder Structure (preserve existing, extend)

```
moodmate-app/
├── src/
│   ├── api/
│   │   ├── client.ts          ← KEEP (no changes)
│   │   ├── auth.ts            ← KEEP (no changes)
│   │   ├── types.ts           ← extend with new response types
│   │   ├── wellness.ts        ← NEW
│   │   ├── checkin.ts         ← NEW
│   │   ├── community.ts       ← NEW
│   │   ├── gratitude.ts       ← NEW
│   │   ├── support.ts         ← NEW
│   │   ├── wallet.ts          ← NEW
│   │   ├── gamification.ts    ← NEW
│   │   └── admin.ts           ← NEW
│   ├── components/            ← FULL REPLACEMENT of all components
│   │   ├── design-system/
│   │   │   ├── GlassCard.tsx      (frosted glass with expo-blur)
│   │   │   ├── Button.tsx         (primary, secondary, ghost, danger)
│   │   │   ├── TextField.tsx      (input with glass style)
│   │   │   ├── Badge.tsx
│   │   │   ├── ProgressRing.tsx   (SVG circular progress)
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Divider.tsx
│   │   ├── wellness/
│   │   │   ├── WellnessTree.tsx   (SVG animated tree)
│   │   │   ├── MoodPicker.tsx     (icon-based, no emojis)
│   │   │   ├── EmotionWheel.tsx   (SVG wheel)
│   │   │   ├── MoodChart.tsx      (SVG line chart)
│   │   │   └── BreathCircle.tsx   (Reanimated breathing ring)
│   │   ├── community/
│   │   │   ├── PostCard.tsx
│   │   │   └── ReactionButton.tsx
│   │   └── gamification/
│   │       ├── XPBar.tsx
│   │       ├── StreakBadge.tsx
│   │       ├── AchievementToast.tsx
│   │       └── MissionRow.tsx
│   ├── navigation/
│   │   ├── types.ts           ← FULL REWRITE (add all new screens)
│   │   ├── RootNavigator.tsx  ← REWRITE (add Onboarding, RoleSelect)
│   │   ├── StudentTabs.tsx    ← REWRITE (Garden|Journal|Support|Profile)
│   │   ├── CounsellorTabs.tsx ← NEW
│   │   └── AdminNavigator.tsx ← NEW
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.tsx      ← REWRITE
│   │   │   ├── OnboardingScreen.tsx  ← NEW (3 slides with liquid animation)
│   │   │   ├── RoleSelectScreen.tsx  ← NEW (Student / Counsellor cards)
│   │   │   ├── LoginScreen.tsx       ← REWRITE
│   │   │   └── SignupScreen.tsx      ← REWRITE
│   │   ├── student/
│   │   │   ├── HomeScreen.tsx        ← REWRITE
│   │   │   ├── JournalScreen.tsx     ← REWRITE
│   │   │   ├── GardenScreen.tsx      ← REWRITE (was WellnessTreeScreen)
│   │   │   ├── SupportScreen.tsx     ← REWRITE
│   │   │   └── ProfileScreen.tsx     ← REWRITE
│   │   ├── modals/
│   │   │   ├── CheckInScreen.tsx     ← REWRITE
│   │   │   ├── BreathingScreen.tsx   ← REWRITE
│   │   │   ├── SOSScreen.tsx         ← REWRITE
│   │   │   ├── GratitudeJarScreen.tsx← REWRITE
│   │   │   ├── AIChatScreen.tsx      ← REWRITE (Groq direct)
│   │   │   ├── CommunityScreen.tsx   ← REWRITE
│   │   │   ├── ProScreen.tsx         ← REWRITE
│   │   │   ├── ShopScreen.tsx        ← REWRITE
│   │   │   ├── HubScreen.tsx         ← REWRITE
│   │   │   ├── GamesHubScreen.tsx    ← NEW
│   │   │   └── CalmGardenScreen.tsx  ← NEW
│   │   ├── counsellor/
│   │   │   ├── CounsellorDashboard.tsx  ← NEW
│   │   │   ├── ScheduleScreen.tsx       ← NEW
│   │   │   ├── StudentsScreen.tsx       ← NEW
│   │   │   ├── StudentDetailScreen.tsx  ← NEW
│   │   │   └── TherapyLibraryScreen.tsx ← NEW
│   │   └── admin/
│   │       ├── HealthPulseScreen.tsx    ← NEW
│   │       ├── AppReviewScreen.tsx      ← NEW
│   │       └── FlaggedContentScreen.tsx ← NEW
│   ├── state/
│   │   ├── useAuthStore.ts    ← KEEP (no changes)
│   │   ├── useToast.ts        ← KEEP
│   │   ├── useAppState.ts     ← REWRITE (remove emojis, add new gamification)
│   │   └── useGamification.ts ← NEW
│   └── theme/
│       └── tokens.ts          ← FULL REWRITE
└── tailwind.config.js         ← NEW
```

---

## 4. Design System Tokens (new tokens.ts)

### Colors
```ts
primary:        '#2D6B42'   // Deep Forest Green
primaryLight:   '#4A9B5A'
primaryDark:    '#1A3328'
bg:             '#FAFAF9'
bgDark:         '#0D1C10'   // dark screens (SOS, Breathing, Calm Garden)
surface:        '#FFFFFF'
surfaceGlass:   'rgba(255,255,255,0.18)'  // glass cards
ink:            '#1A2E1E'
inkSoft:        '#5A7A64'
inkFaint:       '#9DB8A6'
border:         'rgba(0,0,0,0.06)'
borderGlass:    'rgba(255,255,255,0.25)'
green100:       '#EAF4EC'
green200:       '#C5E0CC'
green300:       '#A3CDAC'
amber:          '#F59E0B'
amberSoft:      '#FFF8EE'
red:            '#DC2626'
redSoft:        '#FEE2E2'
purple:         '#7C3AED'
purpleSoft:     '#F0F0FF'
```

### Glass Effect System
```ts
// Three tiers of glass, applied via expo-blur + borderColor + backgroundColor
glass: {
  light: { tint: 'light', intensity: 20, bg: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.4)' },
  medium: { tint: 'light', intensity: 40, bg: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.3)' },
  dark: { tint: 'dark', intensity: 30, bg: 'rgba(13,28,16,0.6)', border: 'rgba(255,255,255,0.12)' },
}
```

### Typography
```ts
font: 'Quicksand'
weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
scale: 10 / 11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 28 / 32
```

### Spacing (8-point grid)
```ts
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 56 / 64
```

### Border Radius
```ts
sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999
```

---

## 5. Navigation Flow (corrected)

```
App Boot
  │
  ├─ Token found in SecureStore?
  │     ├─ YES → user.role → Student Home / Counsellor Dashboard / Admin Panel
  │     └─ NO  →
  │
  Splash (2s animated)
    ↓
  Onboarding (3 slides, skip-able)
    ↓
  Role Select  ← NEW SCREEN (before login)
    ├─ Student  ───→ Login/Signup → Student App
    └─ Counsellor ──→ Login → Counsellor App (or Apply flow)
```

### Role Select behaviour
- Two tappable cards: "I'm a Student" / "I'm a Counsellor"
- Selection stored in Zustand (`selectedRole`) 
- Passed to Signup screen to label the account type
- Backend note: `POST /api/auth/signup` always creates STUDENT. Counsellor application goes to `POST /api/support/counsellors/apply` — this route already exists.
- On Login: after JWT returns, `user.role` determines which tab navigator to mount.

---

## 6. Implementation Phases

### Phase 0 — Package Install & Config (do first, nothing else works)
1. `npm install react-native-reanimated react-native-gesture-handler expo-blur react-native-svg nativewind tailwindcss lucide-react-native @shopify/flash-list expo-haptics`
2. Update `babel.config.js`: add `react-native-reanimated/plugin` last
3. Create `tailwind.config.js` with content paths
4. Update `app.json`: add `@babel/plugin-proposal-export-namespace-from`
5. Wrap `App.tsx` with `GestureHandlerRootView`
6. Load Quicksand font variants (400, 500, 600, 700) in `App.tsx`
7. Replace `theme/tokens.ts` entirely

### Phase 1 — Design System Components
Build these in order (each subsequent phase depends on them):

1. `GlassCard` — expo-blur + border + background opacity
2. `Button` — 4 variants, haptic feedback, Reanimated press scale
3. `TextField` — glass style, animated label, error state
4. `ProgressBar` — Reanimated width transition
5. `ProgressRing` — SVG circle with animated stroke-dashoffset
6. `Skeleton` — shimmer loading animation (Reanimated)
7. `Badge`, `Chip`, `Avatar`, `Divider`
8. `Toast` — slide-up Reanimated notification
9. `BottomSheet` — Reanimated drag-up sheet

> **Verification gate**: All components render correctly in isolation before any screens are built.

### Phase 2 — Auth Flow (Splash → Onboarding → RoleSelect → Login → Signup)

**SplashScreen**
- Animated tree SVG growing from seed (Reanimated + SVG)
- Liquid background: two slowly shifting gradient blobs (Reanimated loop)
- Auto-advance after 2.2s
- On mount: call `useAuthStore.hydrate()` — if session found, skip to correct home

**OnboardingScreen** (3 slides, horizontal swipe, skip button)
- Slide 1: "Your tree grows when you do" — animated tree SVG
- Slide 2: "Check in daily, track your mood" — animated emotion ring
- Slide 3: "Your counsellor, always one tap away" — counsellor card illustration
- Dot pagination indicator, swipe gesture

**RoleSelectScreen** (NEW — positioned after Onboarding, before Login)
- Two large glass cards with subtle depth shadows
- "I'm a Student" / "I'm a Counsellor"
- Selected card: scale up + green border glow (Reanimated)
- Persists role in Zustand, advances to Login

**LoginScreen**
- Glass card containing email/password fields
- Animated background: slowly shifting radial gradient (Deep Forest Green)
- Frosted glass form panel
- "Forgot password" bottom sheet (not navigation)
- Role-aware: shows "Counsellor Login" or "Student Login" in header based on selected role

**SignupScreen**
- Same glass aesthetic as Login
- Fields: Full Name, Institution/University, Email, Password
- Role note: always creates STUDENT — counsellors see "Apply as a counsellor" button that routes to counsellor application form

### Phase 3 — Student App: Core Tabs

**Tab navigator**: Garden | Journal | Support | Profile (matches approved mockups)

**Garden (Home) Tab** — `GardenScreen.tsx`
- Animated wellness tree SVG (Reanimated — grows/bounces on interaction)
- Daily Intention banner (green glass card, app-directed content)
- Mood streak badge (Reanimated counter animation)
- Quick actions grid: Breathe / Journal / Gratitude / SOS (Lucide icons)
- Daily missions section (from `/api/wellness/today`)
- Leaf coin balance with XP progress bar
- API: `GET /api/wellness/today` → goals/missions, `GET /api/auth/me` → profile

**Journal Tab** — `JournalScreen.tsx`
- Entry cards with mood dot indicator (color-coded by emotion)
- New entry: bottom sheet with text field + mood picker
- Entries loaded from `GET /api/auth/me` + journal service (see Backend section)
- Empty state: illustrated empty jar SVG

**Support Tab** — `SupportScreen.tsx`
- Counsellor cards (photo placeholder, star rating, online dot, specialty tags)
- Message / Book Session CTA buttons
- Filter tabs: All / Online Now / My Counsellor
- API: `GET /api/support/counsellors`

**Profile Tab** — `ProfileScreen.tsx`
- Header with avatar, stats row (check-ins, streak, leaf coins)
- Account section: Edit Profile, Upgrade to Evergreen, Tree Shop
- Preferences: toggles (daily reminders, dark mode)
- Logout button

### Phase 4 — Student Modals (full-screen modal presentations)

**CheckInScreen** — SVG Emotion Wheel + sliders
- Stress slider + Energy slider (custom Reanimated sliders)
- Emotion wheel (SVG, tap to select node, ring animates to selection)
- Optional journal note
- API: `POST /api/checkin`

**BreathingScreen** — dark forest theme
- Reanimated SVG circle that pulses (inhale/hold/exhale)
- Phase counter + glow effect (Reanimated shadow animation)
- 4-7-8 breathing pattern
- Awards leaf coins on completion (calls gamification endpoint)

**SOSScreen** — red gradient, immediate action
- Crisis Line / Message Counsellor / Breathing / Grounding cards
- Each card immediately routes or calls
- API: `GET /api/sos` for crisis line numbers

**GratitudeJarScreen** — jar SVG, entry list
- Jar fill level tracks entry count (Reanimated jar fill animation)
- Add entry: floating action button → bottom sheet
- API: `GET /api/gratitude`, `POST /api/gratitude`

**AIChatScreen** — Groq API direct
- Green header with online indicator
- Chat bubbles (user right, AI left)
- Disclaimer banner ("Not a substitute for professional care")
- Groq Llama 3 via `${GROQ_API_KEY}` — **never stored in code**

**CommunityScreen** — feed of anonymous posts
- Daily Intention pinned banner at top
- Filter tabs: All Moments / Exam Stress / Gratitude
- Post cards with Support/Celebrate reaction buttons
- New post: bottom sheet with topic selector
- API: `GET /api/community/posts`, `POST /api/community/posts`, `POST /api/community/posts/{id}/react`

**ProScreen (Evergreen Premium)** — dark theme
- $9.99/month headline
- Feature checklist with Lucide icons
- "Start free 7-day trial" CTA (Paystack integration already in backend)
- API: `POST /api/payments/subscribe` (if exists) or display contact info

**ShopScreen (Tree Shop)**
- 2×3 grid of tree skins (SVG thumbnails)
- Leaf coin balance in header
- Owned = "Active" chip, purchasable = leaf coin price
- Premium-locked skins shown greyed with lock icon
- API: `GET /api/wallet/skins`, `POST /api/wallet/skins/{skinId}/purchase`

**HubScreen (Wellness Hub)** — articles + events
- Featured article hero card (green glass)
- Category filter chips
- Article list cards (icon, title, read time)
- Upcoming events with RSVP
- API: `GET /api/hub/articles`, `GET /api/hub/events`

**GamesHubScreen**
- Featured "Calm Garden" hero card
- 2×2 grid: Thought Sorter / Breath Weaver / Petal Fall / Stone Stack
- Daily challenge tracker (progress dots)
- Each game routes to dedicated screen

**CalmGardenScreen** — dark nature theme
- SVG garden scene with animated plant growth
- Breath cycle drives plant size (Reanimated)
- Round counter, leaf coin earned tracker
- On complete: awards leaf coins via API

### Phase 5 — Counsellor App

Mounted when `user.role === 'COUNSELLOR'` after login. Uses `CounsellorTabs.tsx`.

**CounsellorDashboard**
- Dark header banner (forest green) with welcome + key stats
- Today's schedule with session cards (join video / view notes)
- Pending student requests (accept/decline)
- API: `GET /api/support/counsellors/me/appointments`, `GET /api/support/counsellors/me/requests`

**ScheduleScreen**
- Week date strip (today highlighted)
- "Up Next" session card (green glass)
- Session list for selected day
- API: `GET /api/support/counsellors/me/appointments?date=...`

**StudentsScreen → StudentDetailScreen**
- List of assigned students with mood status indicators
- Tap → StudentDetailScreen: risk badges, SVG mood chart, activity bars, clinical notes
- Send Message / Recommend Resource buttons
- API: `GET /api/support/counsellors/me/students`, `GET /api/checkin/student/{id}/history`

**TherapyLibraryScreen**
- Search bar + category filters
- Resource cards (article / video / audio) with "Send to student" button
- API: `GET /api/hub/articles` (reuse existing)

### Phase 6 — Admin App

Mounted when `user.role === 'ADMIN'` after login. Uses `AdminNavigator.tsx`.

**HealthPulseScreen**
- Crisis alert count (GET /api/admin/crisis-alerts)
- 30-day sentiment bar chart (SVG)
- Wellness trend progress bars
- Community resiliency score
- API: NEW admin endpoints (see Backend section)

**AppReviewScreen**
- Counsellor applications list
- Applicant profile card (credentials, personal statement, specialties)
- Approve / Decline buttons
- API: `GET /api/support/counsellors/requests`, `PUT /api/support/counsellors/requests/{id}/approve`

**FlaggedContentScreen**
- SOS protocol toggles (system settings)
- Flagged post list with risk badge (HIGH / MEDIUM)
- Safe / Remove / Ban action buttons per post
- Team online status avatars
- API: NEW flagged content endpoints (see Backend section)

---

## 7. Backend Additions Required

These are missing from the current backend. Each needs: Java class, DTO, Service, Controller, Repository (if entity), and gateway route entry.

### 7A. Journal Service
The current backend has no journal controller or entity. The frontend has a JournalScreen but nothing to call.

**New files:**
```
backend/journal/
  JournalEntry.java
  JournalEntryRepository.java
  JournalService.java
  JournalController.java
  dto/JournalEntryRequest.java
  dto/JournalEntryResponse.java
```
**Endpoints:**
```
GET  /api/journal                  → list all entries for authenticated user
POST /api/journal                  → create entry {mood, energy, content, tags[]}
GET  /api/journal/{id}             → single entry
DELETE /api/journal/{id}           → delete entry
```

### 7B. Gamification Service
Leaf coin awards already exist in WalletService but there's no XP / achievement / mission tracking.

**New files:**
```
backend/gamification/
  Achievement.java
  AchievementRepository.java
  GamificationService.java
  GamificationController.java
  DailyMission.java
  DailyMissionRepository.java
  dto/AwardXPRequest.java
  dto/GamificationStateResponse.java
```
**Endpoints:**
```
GET  /api/gamification/state       → xp, level, achievements, active missions
POST /api/gamification/award       → award XP for action (breathing, check-in, etc.)
GET  /api/gamification/missions    → today's missions
POST /api/gamification/missions/{id}/complete
GET  /api/gamification/leaderboard → optional: campus leaderboard
```

### 7C. Admin Analytics Endpoints
```
AdminController.java (new or extend existing)

GET  /api/admin/health-pulse       → crisis count, engagement %, DAU, sentiment[], trends[]
GET  /api/admin/flagged-posts      → list of flagged community posts
PUT  /api/admin/posts/{id}/safe    → mark safe
DELETE /api/admin/posts/{id}       → remove post
POST /api/admin/users/{id}/ban     → ban user
GET  /api/admin/sos-config         → SOS protocol toggles
PUT  /api/admin/sos-config         → update SOS protocol settings
```

### 7D. Counsellor Student Mood History
The counsellor needs to view a student's check-in history — this requires a counsellor-scoped endpoint (cannot expose all student data publicly).

**Add to CheckInController.java:**
```
GET  /api/checkin/student/{userId}/history  → counsellor-only, returns 30-day mood trend
```
(Guard with `@PreAuthorize("hasRole('COUNSELLOR') or hasRole('ADMIN')")`)

### 7E. Counsellor Clinical Notes
```
backend/counsellor/notes/
  ClinicalNote.java
  ClinicalNoteRepository.java
  ClinicalNoteService.java
  dto/ClinicalNoteRequest.java
  dto/ClinicalNoteResponse.java

GET  /api/counsellor/notes/{studentId}   → get notes for a student
POST /api/counsellor/notes/{studentId}   → add note
```

---

## 8. Effects Reference Guide

### Frosted Glass Effect (per component)
```tsx
import { BlurView } from 'expo-blur';

<BlurView intensity={40} tint="light" style={styles.glassCard}>
  <View style={{ backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 20,
                 borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
    {children}
  </View>
</BlurView>
```

### Liquid Background Animation (Reanimated)
```tsx
// Two oversized gradient blobs animated in slow looping paths
// Blob 1: translateX -30→30, translateY -20→20, scale 1→1.15 (8s loop)
// Blob 2: opposite phase (offset 4s)
// LinearGradient inside each blob for color depth
```

### Breathing Ring Animation (Reanimated SVG)
```tsx
// SVG Circle with animatedProps driving r (radius) and opacity
// Inhale: r from 60→90 over 4s (cubic bezier ease-in-out)
// Hold: r stays 90 for 7s
// Exhale: r from 90→60 over 8s
// Outer glow rings: opacity pulse in phase with breath
```

### Tree Growth Animation (Reanimated SVG)
```tsx
// Tree trunk: animated height (scaleY from 0→1 on screen enter)
// Canopy circle: animated r (radius)
// Fruit circles: animated opacity (fade in one by one as level increases)
// Whole tree: gentle sway loop (rotate ±2° on a 3s sine cycle)
```

### Press Scale Feedback (Reanimated, on all interactive elements)
```tsx
const scale = useSharedValue(1);
const onPressIn = () => { scale.value = withSpring(0.96, { damping: 15 }) };
const onPressOut = () => { scale.value = withSpring(1, { damping: 15 }) };
const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
```

---

## 9. Screen Build Order (strict sequence — each depends on prior)

| # | Task | Depends On |
|---|------|-----------|
| 0 | Package install + babel config | — |
| 1 | Design tokens (tokens.ts) | 0 |
| 2 | Base components (GlassCard, Button, TextField, etc.) | 1 |
| 3 | SplashScreen | 2 |
| 4 | OnboardingScreen | 2 |
| 5 | RoleSelectScreen | 2 |
| 6 | LoginScreen + SignupScreen | 2, 5 |
| 7 | RootNavigator.tsx + types.ts | 3–6 |
| 8 | StudentTabs.tsx | 7 |
| 9 | GardenScreen (student home) | 8, wellness components |
| 10 | JournalScreen | 8 + Backend 7A |
| 11 | SupportScreen | 8 |
| 12 | ProfileScreen | 8 |
| 13 | CheckInScreen (modal) | 7 |
| 14 | BreathingScreen (modal) | 7 |
| 15 | SOSScreen (modal) | 7 |
| 16 | GratitudeJarScreen (modal) | 7 |
| 17 | AIChatScreen (modal) | 7 |
| 18 | CommunityScreen (modal) | 7 |
| 19 | ProScreen (modal) | 7 |
| 20 | ShopScreen (modal) | 7 |
| 21 | HubScreen (modal) | 7 |
| 22 | GamesHubScreen + CalmGardenScreen | 7 |
| 23 | Backend: Journal (7A) | — |
| 24 | Backend: Gamification (7B) | — |
| 25 | Backend: Admin Analytics (7C) | — |
| 26 | Backend: Counsellor Notes (7E) | — |
| 27 | CounsellorTabs + CounsellorDashboard | 7 + backend |
| 28 | ScheduleScreen + StudentsScreen + StudentDetailScreen | 27 |
| 29 | TherapyLibraryScreen | 27 |
| 30 | AdminNavigator + HealthPulseScreen | 7 + backend 7C |
| 31 | AppReviewScreen + FlaggedContentScreen | 30 |
| 32 | End-to-end integration pass + offline states | all |
| 33 | Performance audit (60fps, FlatList, memoization) | all |

---

## 10. Quality Gates (per screen before moving on)

Every screen must pass before the next phase starts:
- [ ] Matches approved v2 mockup pixel-faithfully
- [ ] No emojis — Lucide icons only
- [ ] Quicksand font used throughout
- [ ] Glass effect renders correctly on both light and dark backgrounds
- [ ] All buttons connect to real backend (no placeholder navigation)
- [ ] Loading skeleton shown while API call is in-flight
- [ ] Error state handled gracefully (toast message)
- [ ] Empty state has a meaningful illustration/message
- [ ] Reanimated animations run at 60fps (no JS thread animations)
- [ ] Haptic feedback on primary button presses
- [ ] TypeScript compiles with no errors (`npm run typecheck`)

---

## 11. What Is NOT Changing

- `src/api/client.ts` — keep as-is, well structured
- `src/api/auth.ts` — keep as-is
- `src/state/useAuthStore.ts` — keep as-is
- `src/state/useToast.ts` — keep as-is
- `BACKEND_BASE_URL` in client.ts — update only if IP changes
- Git branching rule: `main` = frontend only, `backend` = backend only

---

## 12. Estimated Complexity

| Phase | Complexity | Rough size |
|-------|-----------|-----------|
| Package setup + tokens | Low | 1 session |
| Design system components | Medium | 2 sessions |
| Auth flow (5 screens) | Medium | 2 sessions |
| Student tabs (4 screens) | High | 3 sessions |
| Student modals (10 screens) | High | 4 sessions |
| Counsellor app (5 screens) | High | 3 sessions |
| Admin app (3 screens) | Medium | 2 sessions |
| Backend additions (5 items) | Medium | 3 sessions |
| Integration + polish | High | 2 sessions |

---

*This plan is the single source of truth for the MoodMate v2 frontend rebuild. No code is written until this plan is acknowledged and approved.*
