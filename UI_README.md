# MoodMate — UI & Visual Design README

> A student mental wellness app where the **interface itself is the therapy**:
> calm, warm, hand-held — but quietly gamified so the user *wants* to come
> back tomorrow.

This document is the **UI bible** for MoodMate. It explains what the project
is, then dives deep into the visual language, the design tokens, the
component vocabulary, and the screen-by-screen feel of every surface in the
app.

---

## 1. What MoodMate is (in plain English)

MoodMate is a mobile app built for university students (originally scoped
for **KNUST students, CodeQuest@26 hackathon**) that helps them look after
their mental health *daily*, not just in a crisis.

It does five things at once, on one phone:

1. **Mood tracking** — a daily emotion wheel + intensity sliders.
2. **Journaling** — a calendar-strip notebook with guided templates.
3. **Wellness gamification** — a personal "Wellness Tree" that levels up
   (Roots → Sprout → Bloom → Canopy) as the user keeps streaks, earning
   leaves (in-app currency) for skins, boosts, and accessories.
4. **Peer + professional support** — a Community feed (Campus Voices /
   PeerConnect) and a Support tab (book a counsellor, message a peer
   mentor) — with a always-free, always-one-tap-away **SOS** screen.
5. **Guided calm** — breathing sessions, soundscapes, a calm-match memory
   game, daily-calm sessions, and a Wellness Hub of articles/events.

Built with **React Native + Expo + TypeScript**, navigated with **React
Navigation v7**, state-managed with **Zustand**. All 17 screens are real
implementations, not placeholders.

But none of that is what makes it *MoodMate*. What makes it MoodMate is **how
it looks and feels** — which is the rest of this document.

---

## 2. The design direction in one sentence

> **Headspace-calm visuals + Duolingo-style gamified feedback.**

That is the deliberate intersection the whole UI sits at. Soft cream
backgrounds, rounded everything, generous breathing room, plant/nature
metaphors — *and* confetti bursts, floating XP text, animated streak
flames, bouncing checkboxes, tab-icon scale pops on press. The user should
feel **soothed and rewarded at the same time**. Anything that drifts toward
"generic corporate dashboard" is a regression.

---

## 3. The colour palette

Every colour in the app comes from `src/theme/tokens.ts`. Nothing is
hardcoded inline anywhere — that's a house rule.

### Neutrals (the canvas)

| Token        | Hex       | What it is                                            |
| ------------ | --------- | ----------------------------------------------------- |
| `bg`         | `#FBF5EC` | Warm cream app background — *not* white. The "paper" feel. |
| `surface`    | `#FFFFFF` | Cards, sheets, neutral chips                          |
| `ink`        | `#2B2530` | Primary text — a soft near-black with a violet tint   |
| `inkSoft`    | `#6B6470` | Secondary text, subtitles                             |
| `inkFaint`   | `#A7A1AC` | Tertiary text, inactive tab icons, metadata           |
| `line`       | `rgba(43,37,48,0.10)` | Hairline borders                          |
| `shadow`     | `rgba(43,37,48,0.12)` | Card shadows                              |

### Accents (the moods)

The accent palette has **five paired colours**, each one a saturated tone
plus a soft tinted version. Every card tint, every section, every modal
maps to one of these moods.

| Accent      | Bold        | Soft (tint)  | Used for                                                   |
| ----------- | ----------- | ------------ | ---------------------------------------------------------- |
| **Coral**   | `#FF6F4D`   | `#FFE4DA`    | Primary CTA, brand colour, active tab, check-in, urgency   |
| **Sage**    | `#5F9E7C`   | `#E1F0E5`    | Wellness Tree, progress, growth, journaling                |
| **Blue**    | `#5C8AE6`   | `#E3ECFC`    | Breathing, calm, water, peer support                       |
| **Lavender**| `#8E7BC0`   | `#EFE9F8`    | AI / Pro features, profile, "premium-but-friendly"         |
| **Sun**     | `#FFC857`   | `#FFF3D9`    | Streak flame, leaves, rewards, PRO chips                   |

There is also `coralDeep` (`#E85A39`) for hover/pressed states and
`sunText` (`#5A4300`) so yellow chips read as deep brown text instead of
illegible bright yellow.

**Why these specifically?** The combination of cream-paper + coral-coral
+ sage-greens reads as "wellness app for humans," not "medical-grade
clinical tool." The lavender for AI features specifically dodges the
stereotypical electric-purple "tech" look and keeps it gentle.

---

## 4. Shape language — round, always round

Nothing in the app is sharp.

```ts
radii = {
  sm: 12,    // chips, inline tags, small icons
  md: 18,    // cards, sheets, panels
  lg: 26,    // hero cards, modals
  pill: 999, // buttons, chips, tab pills
}
```

- **Buttons** are always full pills (`borderRadius: 999`).
- **Cards** use `radii.md` (18px) — soft but not bubble-like.
- **Hero cards** (the Wellness Tree on Home, the breathing hero on Explore)
  use `radii.lg` (26px) so they feel bigger and more inviting.
- Even the **quick-action icons** on Home use `borderRadius: 16` — square
  enough to anchor, round enough to stay friendly.

There are no sharp corners in the entire app. That's not aesthetics for
its own sake — research-shy edges feel safer to look at, and the whole
brief was "this should feel like a friend, not a form."

---

## 5. Spacing & rhythm

```ts
spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }
```

The whole app is laid out on a **4-pt grid**. The horizontal screen padding
is `spacing.lg` (16px) on every screen. Card padding is also `spacing.lg`,
so card content lines up with screen content when a card is full-bleed.

Generous whitespace is intentional — vertical breathing room between
sections (`spacing.md` between items, `spacing.xxxl` at the bottom of
scrollable screens so the last card never hugs the tab bar).

---

## 6. Typography pairing

Two families, deliberately paired:

| Role             | Font                 | Where it's used                          |
| ---------------- | -------------------- | ---------------------------------------- |
| Display          | **Baloo 2 — Bold**   | Big numbers, hero text, splash brand     |
| Display semibold | Baloo 2 — SemiBold   | Section heroes                           |
| Body             | **DM Sans — Regular**| Long-form text, descriptions             |
| Body medium      | DM Sans — Medium     | Sub-labels, captions                     |
| Body bold        | DM Sans — Bold       | Button labels, section titles, streak nums |

**Baloo 2** is a rounded, friendly display face — chosen specifically because
it pairs with the rounded shape language. **DM Sans** is a clean,
high-x-height workhorse for everything else.

Sizes ladder cleanly:

```ts
fontSizes = {
  xs: 10.5,   // chip labels, metadata
  sm: 12,     // body text in cards
  base: 13,   // default
  md: 14,     // section captions
  lg: 16,     // section titles
  xl: 19,     // greeting, modal titles
  xxl: 22,    // hero numbers (streak count, leaf balance)
  display: 26 // splash, brand
}
```

> **Honest note:** the `.ttf` files for Baloo 2 / DM Sans aren't bundled
> yet because the build sandbox has no Google Fonts access. The app falls
> back to system fonts silently. Drop the fonts in `assets/fonts/` and
> uncomment the `useFonts()` block in `App.tsx` for the full visual.

---

## 7. Elevation & shadow

Two tiers, both soft and warm-tinted (the shadow is `ink` at 12% alpha, not
pure black — black shadows on a cream background look like dirt):

```ts
shadow = {
  sm: { offset: (0, 4),  opacity: 0.5, radius: 10, elevation: 2 },
  md: { offset: (0, 10), opacity: 0.5, radius: 20, elevation: 6 },
}
```

Buttons (primary) carry a **coral-tinted shadow** specifically — the shadow
colour matches the button colour, so it glows softly instead of dropping
darkly. Same principle that makes Stripe / Linear primary buttons feel
"lit from within."

---

## 8. The component vocabulary

These are the reusable bricks every screen is built from. Living in
`src/components/`:

### `Screen.tsx` — the safe-area frame
Every screen's outermost wrapper. Uses `useSafeAreaInsets()` to pad the
real device inset (status bar, notch, nav bar) — *background bleeds full*,
content sits safely below the bars. Owns top/bottom padding exclusively to
prevent silent style overrides.

### `Button.tsx` — two variants
- **Primary**: coral pill, white text, soft coral glow shadow, light haptic
  + spring scale-to-0.95 on press-in.
- **Ghost**: white pill, hairline border, ink text — for secondary actions.
- `fullWidth` and `disabled` props (disabled drops opacity to 0.45 — readable
  but obviously inactive).

### `Card.tsx` — five tinted moods + neutral
Pass a `tint` prop (`coral` / `sage` / `blue` / `lavender` / `sun` / `none`)
and the card paints in the corresponding soft pastel. Neutral cards get a
hairline border instead. Press-state drops opacity to 0.92.

### `Chip.tsx` — pill toggles
Used for topic filters (Community), date strip (Journal), template
selectors. White pill with hairline border when inactive; flips to **ink
black with white text** when active — high-contrast intentional, it's a
selection, not an accent.

### `ProgressBar.tsx`
Animated fill. Used for the Wellness Tree XP bar, daily goal completion,
and modal sub-progress. Fill colour is themable per use (sage for tree,
coral for streak).

### `TextField.tsx`
Used in Login/Signup. Rounded, inline label, focused state lifts the
border colour to coral. Validation states are visible *before* submit
(button stays disabled until inputs validate).

### `EmotionWheel.tsx`
The signature component of the Check-in modal. A radial set of soft-tinted
emoji buttons (😊 calm, 😟 anxious, 😢 sad, 😡 angry, 😴 tired, etc.)
arranged around a centre. Tap one and it pops with a haptic + scale
animation, then reveals a set of intensity sliders below.

### `Confetti.tsx` (`ConfettiBurst`)
Imperative confetti — fired with `ref.current.fire()` from any screen.
Triggers on: completing all 3 daily goals (Home), winning the Calm-Match
game, hitting a streak milestone. Uses the accent palette (coral, sage,
blue, lavender, sun) so even the celebration sticks to the colour system.

### `EmojiBurst.tsx`
A lighter variant — a single emoji that flies upward with fade-out. Used
for floating "+10 XP" text when you tick a goal.

### `Skeleton.tsx`
Shimmer loading placeholder. Matches the corner radius of whatever it's
replacing — never a sharp grey rectangle.

### `ToastHost.tsx`
A single global toast pill that floats above all content. Coral-tinted,
auto-dismisses after ~2.5s. Triggered by any screen calling `useToast()(message)`.

### `AnimatedTabIcon.tsx`
The bottom-tab icons. On selection: scale-pops from 1 → 1.15 → 1.0 with a
spring, while the colour cross-fades from `inkFaint` (grey) to `coral`.
Both outline and filled variants of every icon are pre-paired (e.g.
`home-outline` ↔ `home`) so the focus state swaps the whole glyph weight,
not just the colour.

### `ToggleCards.tsx`
A 2-up segmented card switcher used at the top of Community (Campus Voices
/ PeerConnect) and the Wellness Hub modal (Articles / Events). Big, tappable,
visually distinct from a small segmented control — feels like choosing a
room, not flicking a toggle.

### `ScreenHeader.tsx`
The header pattern for modal screens — title on the left, close (X) button
top-right inside a soft circle, optional subtitle.

---

## 9. Motion — what moves, and why

The whole app uses **React Native's built-in `Animated` API** — no Reanimated,
no Lottie. The animation budget is intentionally small so the app feels
*alive* but never *busy*.

| Motion                                       | Where                               | Why                                          |
| -------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| Button press: spring scale to 0.95           | Every `Button`                      | Tactile confirmation                         |
| Tab icon: scale-pop on focus                 | Bottom tabs                         | Reinforces tab switch                        |
| Animated progress fill                       | Tree XP, goal completion            | Earned-not-given feel                        |
| Floating "+10 XP" text                       | Goal toggle                         | Duolingo-style reinforcement                 |
| Confetti burst                               | All 3 goals done, game win          | Celebratory peak moment                      |
| Breathing ring scale cycle                   | Breathing modal                     | The animation *is* the feature — 4s in, 2s hold, 5s out, looped |
| Tree sway                                    | Wellness Tree modal                 | Tree looks alive when you visit it           |
| Shake-on-insufficient-funds                  | Tree Shop, Calm Match mismatch      | Honest, kind rejection                       |
| Splash logo: fade + scale, auto-advance      | Splash screen                       | First impression, brand moment               |
| Toast slide-in / slide-out                   | `ToastHost`                         | Non-blocking feedback                        |

**Haptics** (`hapticLight`, `hapticSelection`) fire alongside most of these.
On a real device, that combination of subtle visual + subtle physical
feedback is what makes the app feel "premium" without any extra graphics.

---

## 10. The screens — what each one *looks* like

### Splash
Cream background. Brand mark centred, scales up + fades in, then auto-advances
to Login after ~1.5s. Tap-to-skip if the user is impatient.

### Login / Signup
Cream background. Single centred column. Soft pill text fields stacked
vertically. The primary CTA stays **disabled and faded** until the inputs
validate — so the button itself teaches the user the rules. Password fields
have an eye-toggle for show/hide. Errors appear inline, in coral.

### Home (the heart of the app)
Top-down rhythm:
1. **Greeting** — "Hi Orleans 👋" in Baloo Bold, today's date below in faint ink. Avatar circle (lavender-soft) top-right.
2. **Wellness Tree card** — sage-tinted hero card with the tree emoji big on the left, "Lv 2 · 'Sprout'" on the right above an animated sage progress bar. Tap → opens the Tree modal.
3. **Streak card** — sun-tinted, "🔥 5-day streak" big, sub-line "Don't break the chain!".
4. **Today's goals** — neutral card, 3 rows with bouncing checkboxes, XP badges on the right.
5. **Jump back in** — 4 quick-action tiles in a row: 🫁 Breathe (blue), 📓 Journal (sage), 🔍 Explore (lavender), 💗 Check in (coral). Each is a soft-tinted square icon with the label below.
6. **AI Insight** — lavender-tinted card with a tiny **sun-coloured PRO chip** in the corner. Tap → Pro modal.

### Journal
Top: horizontal **calendar strip** (chips for days of this week, today highlighted in coral). Below: stack of **template cards** (Gratitude, Reflection, Brain dump) and **notebook entries** displayed as soft-edged paper-style cards with a date stamp.

### Explore
Top: **breathing hero** — a big blue-tinted card with an animated ring, "Take a breath" CTA. Below: horizontal-scroll **daily calm sessions**. Then: a 2×2 grid of **soundscape tiles** (Rain, Ocean, Forest, Brown noise) each in their own tinted square. Then: **Wellness Hub** card (articles/events), **Calm Match** card (the game), **Challenge** and **Exam Hub** teaser cards.

### Community
Top: **ToggleCards** — "Campus Voices" vs "PeerConnect". Below: a row of topic **Chips** (Stress, Sleep, Relationships, etc.). Below: a feed of **live-reaction posts** — each is a neutral card with the post text, emoji reactions tallied as small soft-tinted pills, and a "join discussion" CTA. Bottom: a **Mentor Spotlight** card with the mentor's avatar, name, expertise tag, and a "Book a chat" coral pill.

### Support
**Appointment card** at top — sage-tinted, shows next booked session or "Book a counsellor" CTA. Below: **Peer mentors** as horizontal cards (avatar circle, name, expertise tag, message icon). Bottom: **Messages** list — clean rows with unread dot in coral.

### Modals (all open with `presentation: 'modal'` — slide-up sheet feel)

- **Check-in** — full-screen, cream bg. EmotionWheel at top. Sliders below for intensity. Save → coral CTA → fires +XP, toast, returns to caller.
- **Wellness Tree** — sage-tinted hero with the tree emoji huge and centred, swaying. Stage label, XP bar, "next stage in X XP" sub-text. Below: leaf balance pill, "Visit shop" ghost button.
- **Gratitude Jar** — lavender-tinted. Large jar emoji at top, list of recent gratitudes below as soft chips, add-new field at the bottom.
- **Breathing Session** — blue-tinted, full-bleed. Centre: a circle that **scales** in time with the phases (4s breathe in → 2s hold → 5s breathe out), with the phase label below. Looped.
- **SOS** — coral-tinted but calm, never alarming. Big "You're not alone" headline, list of crisis hotlines as tappable cards, "I need to talk now" primary CTA. **Always free, never gated** — this is a product ethics rule.
- **Profile** — lavender-tinted. Avatar, name, three stat tiles in a row (streak, tree level, leaves). Below: settings rows.
- **Pro** — sun-tinted. Feature checklist, monthly/yearly **ToggleCards**, big coral CTA. The "premium" pitch but framed gently.
- **Tree Shop** — neutral with sage accents. Grid of tree skins (each a tinted tile), boosts, leaf packs. Insufficient-funds tap triggers a **shake animation** instead of an angry red error.
- **Wellness Hub** — Articles / Events ToggleCards at top, list of cards below.
- **Calm Match** — the memory game. Grid of face-down cards in alternating accent colours. Flip, match, win → confetti.

---

## 11. The bottom tab bar

Five tabs, fixed at the bottom:

```
🏠 Home   📓 Journal   🔍 Explore   💬 Community   🛟 Support
```

White surface, hairline top border. **Active icon** is coral and filled
(solid glyph weight). **Inactive icons** are `inkFaint` and outlined.
Selection plays a haptic tick + the scale-pop animation. Labels are 10pt
DM Sans Bold under each icon.

---

## 12. Design rules I follow (and you should too)

1. **Never hardcode a colour, spacing value, or font.** Always import from
   `src/theme/tokens.ts`. If a value isn't there, add it to tokens *first*,
   then use it.
2. **Round everything.** No sharp corners. If you find yourself adding
   `borderRadius: 4`, ask why.
3. **Soft shadows only.** Shadows are `ink`-tinted at low opacity, never
   pure black.
4. **One source of truth for tree XP, streak, leaves.** All come from
   `useAppState()` so Home, Wellness Tree, and the Shop never disagree.
5. **Animate the moments that matter.** Goal-toggle, streak-milestone,
   game-win, breathing phase. Not everything — that's noise.
6. **Crisis resources stay free, always.** SOS is never behind Pro. Basic
   mood-tracking is never behind Pro. This is a firm product rule.
7. **Tone over chrome.** When in doubt about adding a divider, a border, or
   another label — leave it out. The cream + colour + space is the design.

---

## 13. TL;DR for designers joining the project

- Cream background (`#FBF5EC`), never white.
- Coral is the brand colour. Sage is the wellness/growth colour.
- Five accent moods (coral, sage, blue, lavender, sun) — each has a bold
  + soft pair. Cards use the soft, CTAs use the bold.
- Baloo 2 for display, DM Sans for body. Rounded display + clean sans.
- Rounded everything. Pills for buttons, 18px radius for cards.
- 4-pt spacing grid. Generous whitespace.
- Subtle, deliberate motion: spring scales, animated progress, confetti
  for peak moments, breathing-ring for the breathing screen.
- Tokens live in `src/theme/tokens.ts`. Components live in `src/components/`.
- The vibe is **Headspace × Duolingo**: calm visuals, gamified feedback.
  Hold that line and the app stays itself.
