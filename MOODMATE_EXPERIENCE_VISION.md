# MoodMate — Experience Vision
**The emotional design blueprint**  
**Date:** 2026-07-03  
**Companion to:** MOODMATE_PRODUCT_AUDIT.md (engineering roadmap)  
**Status:** Awaiting approval before implementation

---

> *"The best apps don't just work. They make you feel something."*

---

## The One Question That Governs Everything

Before writing a line of code, designing a screen, or choosing a color — ask this:

**How should a student feel 30 seconds after opening MoodMate?**

The answer: *Lighter. Seen. Like someone is on their side.*

Every decision in this document — every animation, every word, every color — exists to serve that feeling.

---

## 1. Brand Personality

MoodMate is not a feature. It is a relationship.

Think of MoodMate as that one person in your life who is always calm, never judges you, remembers what you told them last week, and somehow always says the right thing at the right time. Not a therapist (too clinical). Not a motivational speaker (too performative). Not a journaling app (too cold). Something warmer. Something that feels genuinely present.

### The Five Traits

**Gentle, not soft.**  
MoodMate doesn't pretend everything is fine. When a student logs "Anxious" three days in a row, MoodMate doesn't respond with "Keep going! You've got this!" It says: *"That sounds like a hard few days. Want to breathe for a moment?"* It holds space for reality without drowning in it.

**Encouraging, not toxic-positive.**  
No fake enthusiasm. No empty affirmations. If you missed a check-in, MoodMate doesn't guilt-trip you. It doesn't even acknowledge the gap unless you want it to. It just says: *"Welcome back."* Nothing more needed.

**Intelligent, not cold.**  
MoodMate learns. Not in a surveillance way — in a way that feels like a friend who pays attention. It notices you always use the app at 11pm. It notices exam season makes you anxious. It uses that knowledge to help, not to market to you.

**Playful, not childish.**  
There is room for lightness. A dancing dandelion. A bubble that pops satisfyingly. A streak flame that flickers with pride. But nothing that ever feels like it belongs in a children's game.

**Student-first, always.**  
This is not a generic wellness app with "student features." This is an app that was built *by someone who understood* what 2am before an exam feels like. What imposter syndrome in a lecture hall feels like. What being far from home for the first time feels like.

### Voice and Tone

The words MoodMate uses should sound like they come from a calm, intelligent peer — never a brand, never a bot.

| Instead of this | Say this |
|---|---|
| "Please complete your daily check-in." | "How are you holding up today?" |
| "Great job! You're doing amazing!" | "That was a hard day. You still showed up." |
| "You have 0 journal entries." | "Your story starts here." |
| "Streak broken." | "Take your time. We'll be here." |
| "Complete mission to earn XP." | "One small thing today. That's enough." |
| "Error loading resources." | "Something went wrong — try again in a moment." |

### What MoodMate is never

- Never judgmental
- Never performatively cheerful
- Never clinical or cold
- Never urgent or pushy
- Never gamified in a way that creates anxiety

---

## 2. Emotional Design Principles

These six principles govern every design decision from layout to color to animation timing.

**1. Reduce before you add.**  
Every element on screen costs the user cognitive energy. Students in low-mood states have less of that energy. Before adding a new component, ask: *what does this earn?* If the answer isn't clear, remove it.

**2. Motion communicates care.**  
In a wellness app, animation is not decoration. A button that springs back after being tapped says: *I'm alive, I'm listening.* A screen that transitions smoothly says: *I'm not rushing you.* Every motion choice is a statement about how the app treats its users.

**3. Color is emotional, not just visual.**  
Warm coral when a user logs happiness. Cool blue when they log anxiety. Deep sage when they finish a session. Colors should respond to the user's emotional state, not just sit as static brand elements.

**4. Never punish. Only encourage.**  
Streaks can be celebrated. They should never create anxiety if broken. Missing a day is not a failure — it is a human experience. MoodMate's response to a broken streak is silence followed by a warm welcome back, never a red counter or a penalty.

**5. The app should feel like it breathes.**  
Background elements move slowly. Cards float slightly. The breathing ring expands and contracts. Nothing is perfectly still. The app itself is alive — a gentle, present entity that exists alongside the user.

**6. Delight should surprise, never demand attention.**  
The best micro-interactions in MoodMate are the ones users notice on their fifth or tenth use and think: *when did that start doing that?* Delight should feel discovered, not announced.

---

## 3. WOW Moments — Per Screen

These are the signature interactions that define MoodMate's emotional character. Each one should be felt, not just seen.

---

### Launch / Splash

**The vision:** The app doesn't open. It *awakens.*

The MoodMate logo blooms into existence — not a simple fade, but an organic expansion from the center, like a flower opening. The background color shifts based on time of day: warm amber at 7am, soft cream at noon, cool lavender at 6pm, deep indigo at 11pm. A single affirmation types itself slowly across the screen in the display font, then softly dissolves. On completion, a gentle double-pulse haptic — almost like a heartbeat.

The student's first second with the app tells them: *this is different.*

**Technical implementation note:** Time-of-day background is achievable with a simple `new Date().getHours()` switch to select a gradient preset. The bloom animation is a spring scale from 0.3 to 1 with `springs.bounce`. The typing affirmation is a character-by-character stagger (already implemented on SplashScreen — extend this pattern here).

---

### Home Screen

**The vision:** The home screen breathes.

The check-in card at the top of the home screen has a very subtle, slow pulse — not distracting, but alive. Like a heartbeat at rest. The pulse speed is 3 seconds per cycle. When the user hasn't checked in yet today, the card glows slightly warmer. When they have, it settles into a calm resting state with a small checkmark.

When a streak increases after a check-in, a small particle effect rises from the streak counter — not full-screen confetti, but a gentle upward drift of 8–12 tiny flame particles that fade out above the counter. This moment should feel earned and quiet, not loud.

The background of the header gradient shifts very slowly (30-second cycle, imperceptible to conscious attention) between two nearby gradient stops — the effect is that the header feels alive, like a sky that changes throughout the day. This uses `Animated.loop` with a very long duration and `useNativeDriver: false` on the gradient colors.

**The greeting is personal:**
- Before first check-in: *"How are you holding up today, [name]?"*
- After check-in (happy): *"Glad you're feeling [emotion] today. 🌿"*
- After check-in (anxious): *"Thanks for telling me. Let's breathe for a moment."*
- Exam season detected (March/April/November/December): *"This time of year is a lot. You're not alone."*

---

### Check-In

**The vision:** Selecting a mood changes the world around you.

When a student taps an emotion, the background color of the screen softly transitions to reflect that emotion. Happy → warm gold wash. Calm → cool sage. Anxious → muted blue-slate. Angry → deep coral. Sad → quiet teal. The transition takes 400ms — slow enough to feel intentional, fast enough to feel responsive.

The emotion wheel's selected sector expands very slightly (scale 1.05) and glows with a soft colored border. The blob at the center of the wheel morphs — not just color, but shape. Happy has rounded, expanded proportions. Anxious has slightly compressed, tense proportions. Sad has a gentle downward pull. These are subtle enough to avoid being cartoonish but meaningful enough to feel emotionally resonant.

**The save moment — the app's most important interaction:**  
After tapping "Log mood," the button doesn't just disappear. It morphs: the gradient fills rotate to a success green, the text changes to a checkmark with "Logged ✓", the button gently scales up 1.05 then down to 1, and the whole screen slowly exhales — content scales down 0.98, the background briefly washes with the emotion color at 20% opacity, then everything fades. The navigation back happens at the end of this exhale, not before. The student should leave the screen feeling like something was *received*, not just submitted.

---

### Journal

**The vision:** Writing feels like releasing something.**

The journal entry screen should feel intimate. The text input area has the faintest parchment texture (a very subtle `backgroundColor` change — off-white rather than pure white). The cursor blinks at a slightly slower rate than default (700ms instead of 500ms). The keyboard appears with a spring rather than a hard cut.

Optional ambient audio: when the student starts typing, they can optionally enable a very quiet background sound (rain, café, library). The choice appears as three small icons in the toolbar — not prominent, just there if wanted. These sounds play via `expo-audio` at low volume with a 2-second fade in.

**The save moment:** When a journal entry is saved, the text doesn't just disappear. It gently floats upward — the whole entry scales to 0.95, fades to 60% opacity, and drifts upward about 40px over 600ms, then the screen transitions. The metaphor is releasing what was on your mind into the world. What was heavy, you've put down.

---

### Breathing Session

**The vision:** The orb is alive.**

The breathing orb should feel like a living thing. On inhale, it expands with a gentle glow that radiates outward — not just scaling, but *luminous*. Two concentric rings expand outward from the orb at 60% and 80% of full scale, fading as they reach the edge of the screen. These rings are the "breath ripples."

Phase background transitions should be smooth gradient morphs, not hard cuts. This is achieved by maintaining two overlapping `LinearGradient` views at the same position, animating `opacity` on the top one between 0 and 1 when phases change. The fade takes 800ms and begins 300ms before the phase label changes — so the visual environment shifts before the instruction does, preparing the user.

**End of session:** Instead of snapping back to the previous screen, the orb slowly contracts to the center, the rings pulse one final time outward in a wide slow arc, and the words "Well done. You breathed." appear in the display font, centered, white. The student holds this moment for 1.5 seconds, then it softly fades to the home screen. The haptic on completion is a `hapticSuccess` — the double pulse that says: *you did something real.*

---

### SOS Screen

**The vision:** A protective cocoon that immediately slows time.**

The SOS screen has its own rules. Every other screen in the app moves at normal speed. This one moves slowly, deliberately, as if the world itself has quieted down.

The background is deep blue-slate (`#0A1628`) — not black (cold, frightening) and not warm cream (wrong context). The color communicates: *depth, calm, nighttime safety.* A very slow, barely visible wave animation plays across the background — think the gentle movement of deep water, achieved with a large SVG path animated with a 6-second loop.

The breathing ring is large: 220px minimum, centered on the upper 60% of the screen. It pulses at exactly 4 seconds (1 second faster than a resting heartbeat, slow enough to encourage deceleration). The scale goes from 1.0 to 1.30. A soft white glow radiates from the ring's center as it expands — implemented as a second `View` with `borderRadius` equal to half its width and a white `shadowColor` with high `shadowRadius`. At full expansion, a very faint concentric outer ring appears and fades.

The text "Breathe with me" is set in the display font at 22px, white, centered below the ring. Below that, in body font: *"Nothing else is needed right now."*

The three action buttons appear in the bottom third — wide, full-bleed, with no border radius on the edges (they feel more anchored, more solid, more trustworthy). They are not coral or purple. They are white text on a slightly lighter version of the dark background — calm, present, not urgent.

The close button is a small `✕` in the bottom right corner. Not prominent. The student should not feel like they're being ejected. Leaving feels intentional, not accidental.

**Entry haptic:** None. Opening SOS should feel like walking into a quiet room, not being startled.

---

### Explore Screen

**The vision:** Three distinct worlds, one door.**

Music, Mindfulness, and Activities are three genuinely different experiences. The tab navigation makes this explicit. Switching tabs is a horizontal slide — the content pages slide like panels on a rail, giving the sense of moving between rooms.

The Music room: track cards have a living waveform even before being played — a very slow, barely visible flat-to-tiny-motion idle state. When a track is selected, its card rises (translate Y -4px) and the waveform comes alive.

The Activities room: each game card has a tiny idle animation unique to its identity. The bubble in BubblePop lazily drifts upward and resets. The dandelion in ProudDandelion sways left and right slowly. The lock in WorryBox gently bobs. These animations use `Animated.loop` with very long durations (3–5 seconds) and `useNativeDriver: true` (translate only).

---

### Community (Campus Voices)

**The vision:** Anonymity feels safe, not sterile.**

When a student opens Campus Voices, a soft ambient sense of "many people are here" is communicated not through user counts but through a gentle background presence — slow, soft opacity pulses on a few community icons that suggest other users are present, breathing, in the same space.

When a post receives a reaction, the emoji doesn't just increment a number. The reacting emoji animates out from the button — a small burst that rises and fades. `EmojiBurst` already exists for this. Make it the default reaction to every interaction.

Writing a post should feel courageous. Before submitting, a soft confirmation moment: the post preview scales up slightly, and a brief phrase appears: *"You're sharing this anonymously. Your words matter."* Then the submit animation — the text lifts, expands to fill the screen for half a second, then reduces to a new card in the feed. The metaphor is: your voice entered the room.

---

## 4. Motion Language

### Core character

MoodMate's motion character is **slow, organic, and weighted.** Nothing snaps. Everything arrives. The app moves the way a person moves when they're calm — not slow from laziness, but slow from presence.

### Spring taxonomy

Replace all hardcoded animation values in the codebase with the following named system:

| Name | Character | Use case | Config |
|---|---|---|---|
| `snap` | Instant, tight | Button press feedback | `friction: 8, tension: 200` |
| `response` | Fast, minimal bounce | Card selection, chip toggle | `friction: 7, tension: 160` |
| `enter` | Medium, gentle bounce | Cards, modals arriving | `friction: 6, tension: 120` |
| `float` | Slow, soft | Background orbs, particles | `friction: 14, tension: 50` |
| `settle` | Very slow, no bounce | Full-screen transitions | `friction: 12, tension: 40` |

These map directly to the existing `springs` token object. The implementation is already in `tokens.ts` — the discipline is using it everywhere instead of hardcoding.

### Stagger

Lists and grids never animate all at once. Each item enters with an offset of 40ms (already defined as `timing.cardEntry`). Cards in the first position animate first; the last card arrives slightly after. This gives the impression the screen is composed, not rendered.

### The golden rule of MoodMate motion

**If you can feel the animation resisting you, it's too slow. If you can't feel it at all, it's too fast. Find the moment where it feels like the app is gently agreeing with what you just did.**

### What MoodMate motion is never

- Never bouncy enough to feel playful/childish (max bounciness on entry springs: 8)
- Never so fast it feels mechanical
- Never decorative without serving a purpose
- Never blocking user interaction (all animations should be interruptible)

---

## 5. The Mood Forest — Gamification Philosophy

### The problem with XP bars

XP bars, level numbers, and daily mission counters create performance anxiety. A student who has missed three days and sees a broken streak, an XP deficit, and a missed mission counter doesn't feel motivated — they feel behind. And feeling behind in an app designed to help you feel better is the worst possible outcome.

The current gamification system (XP, levels, badges, streaks, daily missions) is not wrong — it's incomplete. It needs a philosophical foundation.

### The Mood Forest

The Mood Forest is MoodMate's core gamification metaphor. Replace "XP bar" and "level number" with a living ecosystem that grows based on consistent self-care.

**How it works:**

Every mood check-in plants something. Not a number — a living thing.

- Log *happy*: a sunflower seed is planted
- Log *calm*: soft green moss appears on a stone
- Log *anxious but still showed up*: a resilient oak sapling takes root
- Complete a breathing session: your plants are watered
- Write a journal entry: sunlight reaches your forest
- Reach out in the community: a new path opens between trees

**The critical rule:** Plants in the Mood Forest never die. If a student misses a week, their flowers don't wilt. They go dormant — still there, still theirs, still waiting. When the student returns, the first check-in gently reawakens the forest. A tiny animation: a leaf uncurls, a petal opens. The message: *I was waiting for you. Welcome back.*

**Growth without pressure:**

The forest doesn't demand anything. It grows when you show up. It rests when you don't. Its only communication to the student is through beauty — a richer forest means more self-care has happened. A sparse forest is never a failure; it's an invitation.

**Badges become rare plant unlocks:**

Instead of "3-Day Streak → badge unlocked," the mechanic becomes: "3-Day Streak → Lavender blooms in your forest." The student doesn't collect badges in a grid — they cultivate a landscape. The Journal badge becomes a reading nook. The Community Voice badge becomes a shared garden path. The SOS completion becomes a lantern that glows at night.

**The forest as a social space (future vision):**

Campus Voices could eventually show a community forest — the combined growth of all students at an institution. No individual attribution. Just the collective evidence that people are showing up for themselves.

### Keeping the current system

The XP, levels, badges, and streaks don't disappear. They become the *engine* beneath the Mood Forest. XP determines which plants are unlocked. Streaks are "days of sunlight." Badges are rare flora. The numbers still exist — they're just not the face of the experience.

### Implementation path

Phase 1: Build the forest as a visual screen (a dedicated `MoodForestScreen`). Render procedurally from existing gamification data. No backend changes needed.

Phase 2: Replace the `WellnessTreeScreen` (which already exists as a precursor concept) with the Mood Forest. Wire to the same `useWellnessStore` data.

Phase 3: The home screen header adds a tiny forest preview — 3–4 of the student's current plants rendered in a small illustrated band above the check-in card.

---

## 6. AI Personalization Vision

### The principle

MoodMate should feel like it pays attention. Not surveillance — *attention.* Like a friend who remembers you said exams are stressful, and checks in differently in March than in July.

### Near-term (achievable now, no backend changes)

**Time-of-day awareness:**  
The app already has time-of-day greetings (`getGreeting()` in HomeScreen). Extend this to content selection. At 6am, default to breathing and journaling (calm start). At 11pm, default to SOS visibility and calming music. At 7pm on a Thursday (peak study anxiety), surface the Worry Box and Safe Place.

**Mood pattern detection:**  
If a student's last 3 check-ins are all "Anxious" or "Sad," the home screen subtly changes. The check-in card CTA changes from "How are you today?" to "Still with you. How are you holding up?" The primary quick action changes from "Journal" to "Breathe" — a gentle suggestion, not a prescription. This requires reading `useWellnessStore` mood history (already stored).

**Exam season awareness:**  
Hardcode academic calendar awareness. October, November, March, April: the app knows. During these months, the affirmation category skews toward resilience rather than joy. The daily mission surfaces breathing over community posting. The check-in prompt includes "Exam season is hard. There's no wrong answer here."

**Affirmation personalization:**  
The current 7-affirmation rotation (`AFFIRMATIONS` array in ExploreScreen) is too small and static. Build a categorized pool of 40+ affirmations: joy-aligned, anxiety-aligned, resilience-aligned, fatigue-aligned. After each check-in, the pool for the next 24 hours is drawn from the category matching the logged emotion. Students who log "Exhausted" see affirmations about rest. Students who log "Happy" see affirmations about presence.

### Medium-term (requires small backend addition)

**Mood-based content recommendations:**  
After a check-in, the Explore tab's default view changes. Anxious → Breathing Session surfaces first. Sad → Safe Place and journaling prompt. Happy → Community tab (share the good). Calm → Music room with ambient recommendations.

**Gentle absence check:**  
After 3 days without a check-in (detectable from `useWellnessStore` data), the next app open shows a soft, non-guilt message: *"It's been a few days. How are you doing?"* — displayed instead of the standard greeting. One tap to dismiss. No counter, no streak warning, no pressure.

### Long-term vision

**The AI companion:**  
An entity with a name and a character — not "AI Assistant" but something with personality. It lives in the app the way a plant lives in a room: quietly, present, occasionally surprising. It learns the student's patterns over a semester. By finals week, it already knows this is the hardest time of year for them. It has adjusted its language, its suggestions, its timing, without ever making those adjustments feel algorithmic.

This is where MoodMate becomes genuinely different from Headspace and Calm. Those apps are content libraries. MoodMate, at its fullest, is a relationship.

---

## 7. Sound and Haptics Design Language

### Sound principles

Sound in MoodMate is always:
- Optional (never forced, always user-controlled)
- Quiet (designed to complement silence, not replace it)
- Purposeful (every sound has a reason)
- Warm (no harsh tones, no clinical beeps)

### The sound vocabulary

| Moment | Sound character | Implementation |
|---|---|---|
| App launch completion | Soft chime, single note, 200ms fade | Short audio file via `expo-audio` |
| Check-in save | Warm double-tone chord, ascending, 400ms | Audio file |
| Breathing inhale | Very low, slow sine tone that rises | Audio file, looped for phase |
| Breathing exhale | Tone descends and fades | Audio file |
| Badge unlock | Soft shimmer, three ascending notes | Audio file |
| Forest growth (Mood Forest) | Single warm pluck (like a kalimba) | Audio file |
| Journal save | Soft rustle, like pages | Audio file |
| Ambient: Rain | Looped rain ambience | Audio file, `expo-audio` background |
| Ambient: Forest | Looped forest ambience | Audio file |
| Ambient: Library | Very quiet background murmur | Audio file |

All sounds are user-toggleable from a single switch in Profile settings: "Sound effects" (on/off) and "Ambient audio" (on/off) independently.

### Haptics design language

The haptic vocabulary maps weight to action weight. Lighter interactions = lighter haptics.

| Interaction | Haptic | Reason |
|---|---|---|
| Tap any card | `hapticLight` | Gentle acknowledgment |
| Toggle a goal | `hapticLight` | Lightweight action |
| Select an emotion | `hapticSelection` | Fine-grained selection |
| Complete check-in | `hapticSuccess` | Significant positive moment |
| Unlock a badge | `hapticHeavy` followed by `hapticSuccess` | Two-beat celebration |
| Breathing phase change | `hapticLight` | Rhythm cue (gentle) |
| Breathing session complete | `hapticSuccess` | Session milestone |
| Journal save | `hapticMedium` | Substantial action |
| SOS screen open | *No haptic* | Calm entry, no startle |
| SOS action tap | `hapticLight` | Gentle, not alarming |
| Error / failed save | `hapticWarning` | Clear but not harsh |
| Streak milestone | `hapticHeavy` | Significant achievement |
| Forest plant grows | `hapticLight` (single) | Quiet delight |

---

## 8. Illustration and Visual Character

### The gap

MoodMate currently has no original illustration. It uses emoji throughout — which works, but limits the emotional range available. To reach award-winning level, the app needs a visual language that is distinctly MoodMate.

### The character: Sage

Sage is a small sprout. Not a cartoon animal, not a human avatar — a plant. It has two small round eyes and a gentle expression. It communicates through posture and expression alone. It lives in the Mood Forest, but appears throughout the app in contextually appropriate moments.

**Sage's expressions:**

- **Neutral / resting:** Gently swaying, small content smile
- **Happy:** Leaves spread wide, eyes brightened, leaning forward
- **Anxious:** Slightly hunched, leaves pulled in, eyes wide but soft
- **Sad:** Drooping gently, eyes downcast, one leaf hanging low
- **Proud:** Standing tall, leaves spread, the tiniest smile
- **Exhausted:** Leaning against a small rock, eyes half-closed
- **Welcoming (returning user):** Reaching one leaf out slightly, like a wave

### Where Sage appears

- Empty state on Journal screen: Sage sitting with a tiny journal, looking up
- Empty state on Community: Sage waving gently into an empty space
- After first check-in ever: Sage plants the first seed (a 2-second animated moment)
- After a 7-day streak: Sage stands next to a newly bloomed flower
- SOS completion (when user closes the screen): Sage simply, quietly waves
- After journal save: Sage briefly holds the words, then releases them upward

### Illustration style

Sage and all MoodMate illustrations should use a consistent visual language:
- **Line weight:** Thin, rounded, organic (no sharp angles)
- **Color palette:** Drawn from the design token system (coral, sage, lavender, sun)
- **Texture:** Very subtle watercolor wash — not digital-flat, not realistic
- **Scale:** Always small and humble in relation to the screen — Sage never dominates a layout, it *belongs* in it

### Empty states (immediate priority)

Even before a full illustrated character is developed, empty states should have warmth. The current likely default is a blank screen or a generic icon. Replace with:

| Screen | Empty state message | Visual |
|---|---|---|
| Journal (no entries) | "Your story starts here." | Tiny open book illustration |
| Community (no posts) | "Be the first voice today." | Simple concentric circles |
| Mood History (new user) | "Check in today to start your story." | Simple calendar with one highlighted dot |
| Gratitude Jar (empty) | "Drop something in." | Simple jar outline |
| Worry Box (empty) | "Nothing locked away. A good day." | Simple closed lock |

---

## 9. The User's Emotional Arc

What does using MoodMate feel like, from open to close?

### The ideal 3-minute session (daily user)

```
0:00 — App opens
      Splash breathes in. Time-of-day gradient. Affirmation appears.
      Haptic: one gentle pulse.
      Feeling: "Oh. This is nice."

0:05 — Home screen
      Greeting uses their name and time of day.
      Check-in card pulses gently.
      Streak flame flickers if active.
      Feeling: "Someone's been expecting me."

0:20 — Check-in
      Emotion wheel. They tap "Anxious."
      Background shifts to cool blue.
      Wheel sector glows.
      Feeling: "The app noticed. It changed for me."

0:40 — Save
      Button morphs to checkmark.
      Screen exhales.
      Navigate back.
      Haptic: success double-pulse.
      Feeling: "Something was received."

0:45 — Home again
      Check-in card now calm, checkmark visible.
      A soft prompt appears: "Want to breathe for a moment?"
      (Because recent mood was Anxious.)
      Feeling: "It's paying attention."

1:00 — Optional: Breathing session
      Orb expands. Rings ripple. Background shifts.
      Phase transitions are smooth.
      End: "Well done. You breathed."
      Feeling: "I'm a little lighter."

3:00 — Close app
      No notification sent. No reminder. No pressure.
      Just a quiet sense that something small was done.
      Feeling: "That was for me."
```

### The crisis session (SOS user)

```
— Student triggers SOS from anywhere
      Screen dims. Deep blue arrives.
      No haptic.
      Feeling: "I'm in a safe place."

— Breathing ring, large and slow
      "Breathe with me."
      Nothing else needed right now.
      Feeling: "I don't have to do anything. Just follow this."

— After 30 seconds: action buttons appear (fade in)
      Grounding / Counsellor / Crisis line
      Actual navigation. Actual help.
      Feeling: "When I'm ready, there's a next step."

— Close SOS
      Sage waves quietly.
      App returns to wherever student came from.
      No recap. No summary. No achievement for using SOS.
      Feeling: "That was handled with dignity."
```

---

## 10. Design System 2.0

The token system is good. These additions make it complete.

### 8-point spacing system
All spacing values should be multiples of 8px. The current token system (`xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32`) uses 4-point increments. Enforce 8-point at the component layout level (padding, margin, gap between sections). Keep 4-point for internal component values (icon padding, pill padding).

### Elevation scale (shadow)
Current: `shadow.sm` and `shadow.md`. Add:
- `shadow.flat` — no shadow (surface is flush with background)
- `shadow.lg` — for modals and bottom sheets (stronger lift)
- `shadow.floating` — for the check-in CTA card (maximum elevation, creates clear hierarchy)

### Motion scale (in tokens)
Add a `motion` token alongside `springs` and `timing`:
```ts
export const motion = {
  durationFast:   150,   // micro-interactions
  durationBase:   300,   // standard transitions
  durationSlow:   500,   // screen transitions
  durationBreath: 4000,  // breathing cycles, background shifts
  easingStandard: Easing.bezier(0.4, 0, 0.2, 1),  // Material-inspired
  easingEnter:    Easing.out(Easing.back(1.2)),     // spring feel
  easingExit:     Easing.in(Easing.cubic),           // confident exit
} as const;
```

### Semantic color aliases
Add semantic aliases to the color system:
```ts
export const semantic = {
  positive:  colors.sage,
  warning:   colors.sun,
  negative:  colors.coral,
  neutral:   colors.lavender,
  muted:     colors.inkFaint,
  success:   '#3D8A63',      // deeper sage for success states
  focus:     colors.blue,
  crisis:    '#0A1628',      // SOS background
} as const;
```

### Adaptive typography minimum
Enforce a minimum font size of 12px (`fontSizes.sm`) for any text the user needs to read. The `fontSizes.xs` value (10.5) is permitted only for decorative labels, timestamps, and metadata that does not carry critical information.

---

## 11. What Winning Looks Like

If a judge opens MoodMate for the first time and has 90 seconds, here is what they experience:

- The splash breathes. They notice it.
- The home screen feels alive — something pulses gently.
- They tap Check-In. The background changes color when they select an emotion. They pause for a moment. *Why did it do that?*
- They save. The screen exhales. A haptic. They feel it.
- They go to Explore. They notice the idle animations on the game cards.
- They open SOS. The screen goes quiet. Deep blue. A breathing ring, large and slow. "Breathe with me."
- They close the app.

They will say: *I don't know exactly what that was — but I want to show it to someone.*

That is the goal. Not a feature list. Not a polished UI. An experience that transfers — one person to another — because it made them feel something.

---

## Awaiting Approval

This document defines the emotional design direction for MoodMate.

No implementation has begun. When you're ready, the recommended order is:

1. **Sprint 1 (from engineering roadmap):** Fix the two broken SOS buttons — 1 hour of work, zero risk
2. **Brand pass:** Voice and tone review of all copy in the app
3. **Mood Forest:** Replace WellnessTreeScreen with the forest metaphor
4. **Check-in emotional response:** Background color shift + exhale save moment
5. **SOS screen redesign:** Deep blue + large ring + real navigation
6. **Motion language pass:** Standardize all animations to the spring taxonomy above

These can be approved individually or as a group. Each one builds on what came before but can ship independently.
