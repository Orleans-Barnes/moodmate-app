# MoodMate Design Bible
### The governing standard for every screen, component, interaction, animation, illustration, sound, and future feature

**Version 1.0 — 2026-07-03**  
**Status: Active — All implementation must conform to this document**

> This document supersedes all prior design decisions. If an existing screen, component, or interaction conflicts with anything written here, the Design Bible takes precedence. Exceptions require explicit approval and must be documented.

---

# PART ONE: FOUNDATION

---

## 1. Brand DNA

### Why MoodMate Exists

Students carry invisible weight. The pressure of exams, the loneliness of being far from home, the performance anxiety of imposter syndrome, the 2am panic that has nowhere to go. Most mental wellness apps treat these as abstract problems to be solved with features. MoodMate treats them as human experiences to be met with presence.

MoodMate exists to make one student feel slightly less alone — every single day.

That is the product.

### The Promise

> *MoodMate is the senior friend every first-year student wishes they had — calm, wise, never judgmental, always available, and genuinely happy to see you.*

Every design decision, every word of copy, every animation, every color choice, every haptic — is measured against this promise.

### The North Star Question

Before shipping any screen, component, or interaction, ask:

**"How does a student feel 30 seconds after this?"**

The answer must be: *Lighter. Seen. Like someone is on their side.*

If the answer is anything else — confused, anxious, pressured, guilty, overwhelmed — redesign until it isn't.

### Brand Values (in order of priority)

1. **Dignity** — Every student deserves to be treated with full human dignity, regardless of their mental state, their streak count, or whether they've opened the app in three weeks.

2. **Honesty** — MoodMate never pretends. If something is hard, we say it's hard. If a student is struggling, we don't paper over it with toxic positivity.

3. **Presence** — The app feels genuinely attentive. Not surveillant. Not algorithmic. Present — like someone paying attention.

4. **Lightness** — Not lightness as in trivial. Lightness as in relief. The app should make things feel more manageable, not more complex.

5. **Growth** — Not achievement. Not performance. Growth — the quiet, patient kind that doesn't demand to be noticed.

---

## 2. The Five Traits

These are non-negotiable personality characteristics. Every copy line, every UX decision, every feature concept is checked against all five.

**Gentle, not soft.**  
MoodMate holds space for hard truths. It doesn't pretend everything is fine. But it approaches difficulty with care, not alarm.

**Encouraging, not toxic-positive.**  
No hollow affirmations. No performative enthusiasm. Encouragement that acknowledges reality: *"That was a hard week. You still showed up."*

**Intelligent, not cold.**  
The app pays attention. It notices patterns. But it uses what it notices to help — never to pressure, market, or manipulate.

**Playful, not childish.**  
There is room for delight, for a dancing dandelion, for a bubble that pops satisfyingly. But nothing that feels like a children's game. Students are adults dealing with adult pressures.

**Student-first, always.**  
This is not a generic wellness app with "student features." It was built *from the inside* — by someone who understood what exam season feels like, what imposter syndrome in a lecture hall feels like, what being far from home for the first time feels like.

---

## 3. Voice and Tone

MoodMate speaks like a calm, intelligent peer. Never a brand. Never a bot.

### The Voice Test

Before publishing any copy, read it aloud. If it sounds like it could have been written by an AI assistant or a corporate marketing team, rewrite it.

### Word rules

| Never say | Always say |
|-----------|------------|
| "Please complete your daily check-in." | "How are you holding up today?" |
| "Great job! You're amazing!" | "That was a hard day. You still showed up." |
| "You have 0 journal entries." | "Your story starts here." |
| "Streak broken." | "Take your time. We'll be here." |
| "Complete mission to earn XP." | "One small thing today. That's enough." |
| "Error loading data." | "Something went wrong — try again in a moment." |
| "Unlock achievement." | "Something new grew in your forest." |
| "No data available." | "Nothing here yet — and that's okay." |
| "Session expired. Please log in again." | "Welcome back. Let's pick up where you left off." |
| "Feature not available." | "This is coming soon — we're working on it." |

### Sentence construction rules
- Short sentences. One idea per sentence. Breathe.
- Present tense. Not "you will feel" — "you feel."
- Second person always. "You." Never "the user" or "students."
- Active voice. "Your forest grew" not "Growth has been recorded."
- Never use exclamation marks for achievements. Quiet pride is more powerful.

### Silence as a communication tool

Sometimes MoodMate says nothing. That is a voice choice, not an absence.

When a student closes the SOS screen: no message. Just a quiet return to the app.  
When a journal entry is saved: no congratulations. The act was the acknowledgment.  
When a long streak is broken: no notification. No counter. Silence. We wait.

**Silence is the most respectful sound MoodMate makes.**

---

# PART TWO: VISUAL IDENTITY

---

## 4. Visual DNA

MoodMate must be instantly recognizable from a screenshot, even with the logo hidden. These five visual characteristics are the fingerprint:

**1. Breathing gradients**  
Colors are never static. Header gradients shift very slowly. Backgrounds have subtle life. The gradient is not decoration — it is the ambient emotional state of the screen.

**2. Layered glass**  
Cards float on gradients. Glass sits on color. Color sits on depth. The UI has three visible layers minimum: a background (gradient or textured), a mid-layer (the card surface, glass or white), and a foreground (content). Nothing is flat. Everything has depth.

**3. Organic geometry**  
All shapes are rounded. Corner radius approaches the pill (borderRadius: 999) generously. No hard edges anywhere in the UI. Rounded corners communicate kindness.

**4. Botanical presence**  
Plants, flowers, leaves, roots, soil — these appear as illustrations, metaphors, icons, and animation metaphors throughout the app. The botanical vocabulary is MoodMate's visual language for growth.

**5. Ambient light**  
Cards cast warmth, not just shadow. Glows surround interactive elements. The colored shadow system (`glow.coral`, `glow.sage`, etc. in tokens) is used to suggest light sources within the UI — as if each card has a gentle internal warmth.

### What MoodMate never looks like
- Flat, clinical, sterile
- Dark mode default (we are the warmth in a dark phone)
- Dense information grids
- Sharp corners anywhere
- Data tables or spreadsheet-style layouts
- Neon or aggressive colors
- Loud, cluttered, visually competitive

### The recognition test
If a screenshot of MoodMate were shown to someone who has never seen the app, alongside screenshots from Headspace, Calm, and Wysa, MoodMate should be immediately distinguishable. The botanical depth, the glass layers, the breathing gradients, and the warm palette should read as a coherent and original visual identity.

---

## 5. Color System

### Semantic meaning

Every color in MoodMate carries emotional meaning. Use them accordingly.

| Color | Token | Emotional meaning | When to use |
|-------|-------|-------------------|-------------|
| Coral | `colors.coral` | Energy, urgency, courage | Primary CTA, check-in, alerts |
| Sage | `colors.sage` | Growth, calm, groundedness | Journal, completion states, forest |
| Lavender | `colors.lavender` | Reflection, rest, depth | Explore, breathing, night modes |
| Blue | `colors.blue` | Trust, clarity, intelligence | Support, counsellor, information |
| Sun | `colors.sun` | Joy, warmth, celebration | Achievements, streaks, happiness state |
| Deep blue-slate | `semantic.crisis` | Safety, protection, depth | SOS only |

### Emotional color response

When a student selects an emotion in check-in, the screen background responds. These are the pairings:

| Emotion | Background color wash |
|---------|----------------------|
| Happy / Joyful | Warm gold (`colors.sun` at 15% opacity) |
| Calm / Content | Soft sage (`colors.sage` at 12% opacity) |
| Anxious / Nervous | Cool blue-slate (custom `#E8EFF8` at 20% opacity) |
| Sad / Low | Muted teal (`#DDE8E8` at 18% opacity) |
| Angry / Frustrated | Deep coral (`colors.coral` at 10% opacity) |
| Grateful / Loved | Warm lavender (`colors.lavenderSoft`) |

These washes are applied to the scroll background, not the cards. The effect is atmospheric — present but never overwhelming.

### Seasonal awareness (future)

The color system has a seasonal dimension for the Mood Forest and home screen ambient:

- Spring (March–May): Bloom pinks and greens, high saturation
- Summer (June–August): Warm gold and coral, full brightness
- Autumn (September–November): Amber, rust, warm brown tints over backgrounds
- Winter (December–February): Cool lavender, soft blue, reduced saturation

These seasonal overlays affect ambient backgrounds only — never the brand coral/sage/lavender primary palette.

---

## 6. Typography System

### Font pairing rationale
- **Baloo 2** (display, headers): Warm, rounded, slightly playful. Communicates personality and approachability.
- **DM Sans** (body, UI): Clean, modern, highly legible. Communicates clarity and intelligence.

This pairing says: *I'm warm and I'm smart.*

### Type scale enforcement

| Token | Size | Use |
|-------|------|-----|
| `fontSizes.display` | 26px | Screen titles, hero moments |
| `fontSizes.xxl` | 22px | Section headlines |
| `fontSizes.xl` | 19px | Large sub-headers |
| `fontSizes.lg` | 16px | Body emphasis, card titles |
| `fontSizes.md` | 14px | Primary body text |
| `fontSizes.base` | 13px | Secondary body text |
| `fontSizes.sm` | 12px | **Minimum for readable content** |
| `fontSizes.xs` | 10.5px | Decorative only (timestamps, metadata that users don't need to read) |

**Hard rule: Nothing the user needs to read may be below 12px.** No exceptions.

### Line height rules
- Display text (Baloo 2): line height = font size × 1.2
- Body text (DM Sans): line height = font size × 1.5
- Long-form text (journal, notes): line height = font size × 1.7

### Typography rhythm
Every text block should breathe. Minimum spacing between a headline and its body text: `spacing.sm` (8px). Minimum spacing between separate content sections: `spacing.xl` (20px).

---

## 7. Spacing System

MoodMate uses an **8-point grid** for all layout decisions.

| Token | Value | Use |
|-------|-------|-----|
| `spacing.xs` | 4px | Internal component micro-spacing (icon padding, pill padding) |
| `spacing.sm` | 8px | Tight spacing within components |
| `spacing.md` | 12px | Standard component internal padding |
| `spacing.lg` | 16px | Section padding, card padding |
| `spacing.xl` | 20px | Between content sections |
| `spacing.xxl` | 24px | Between major UI zones |
| `spacing.xxxl` | 32px | Screen edge breathing room, between screens |

**Rule:** All padding and margin between layout elements must be a value from this table. No custom pixel values for spacing.

---

## 8. Elevation and Shadow

### Elevation scale

| Name | Token | Use |
|------|-------|-----|
| Flush | `shadow.flat` | Elements that belong to the background; no lift |
| Low | `shadow.sm` | Cards in a list, secondary UI elements |
| Mid | `shadow.md` | Primary cards, modal surfaces |
| High | `shadow.lg` | Bottom sheets, overlaid modals |
| Floating | `shadow.floating` | Primary CTA (check-in card), critical single-action elements |
| Glow | `shadow.coralGlow`, `shadow.sageGlow`, etc. | Emotional emphasis, active states |

**Elevation communicates importance.** The highest-elevation element on any screen should be the primary action.

---

## 9. Border Radius System

| Name | Value | Use |
|------|-------|-----|
| `radii.sm` | 12px | Small chips, tags, inline elements |
| `radii.md` | 18px | Standard cards |
| `radii.lg` | 26px | Large cards, primary surfaces |
| `radii.xl` | 30px | Hero cards, featured elements |
| `radii.pill` | 999px | Buttons, CTAs, status pills |

**Rule:** Corners express kindness. When in doubt, round more.

---

# PART THREE: EXPERIENCE DESIGN

---

## 10. Emotional Design Principles

These six principles govern every UX decision. They are the product's constitution.

**1. Reduce before you add.**  
Every element costs cognitive energy. Students in low-mood states have less of that energy. Before adding any component, ask: *what does this earn?* If unclear, remove it.

**2. Motion communicates care.**  
In a wellness app, animation is not decoration. A button that springs back says: *I'm listening.* A smooth transition says: *I'm not rushing you.* Every motion choice is a statement about how the app treats people.

**3. Color is emotional, not just visual.**  
Colors respond to context. The screen adapts to the student's emotional state. Colors are empathetic, not decorative.

**4. Never punish. Only encourage.**  
Streaks celebrate. They never create anxiety when broken. Missed days are met with silence and a warm welcome back — never a red counter, a penalty, or a judgmental message.

**5. The app breathes.**  
Background elements move slowly. Cards float. The breathing ring expands and contracts. Nothing is perfectly still. The app itself is alive — a gentle, present entity alongside the user.

**6. Delight should be discovered, not announced.**  
The best micro-interactions are the ones users notice on their fifth use: *when did that start doing that?* Delight is ambient, not performative.

---

## 11. The Quality Gate

Every screen or feature must pass all eight questions before it ships. No exceptions.

1. **Clarity in 3 seconds.** Can a new user understand the screen's purpose in 3 seconds without reading?
2. **Obvious primary action.** Is the most important action visually dominant without instruction?
3. **Motion with purpose.** Does every animation serve a meaning, or is it decorative?
4. **Reduction test.** Can one element be removed and still communicate the same thing? If yes, remove it.
5. **Cohesion test.** Does this screen feel like it was made by the same person as every other screen?
6. **Anxiety audit.** Does this screen reduce anxiety or create it? (Any score above neutral fails.)
7. **Accessibility check.** All text ≥ 12px. All interactive elements have accessibilityLabel. All touch targets ≥ 44pt.
8. **Promise alignment.** Does this screen make the student feel lighter, seen, and supported?

If any answer is No, the screen is not ready.

---

## 12. Measurable Success Criteria

### First 30 seconds
A student who has never seen MoodMate must be able to:
- Understand the app's purpose without reading any text
- Begin a mood check-in within 3 taps
- Know what to do next without hunting
- Experience at least one moment of "this is different"

### First week
A student who has used MoodMate for 7 days should:
- Recognize MoodMate's visual identity in a screenshot (logo hidden)
- Be able to describe one interaction that felt unlike any other app
- Have returned at least 3 times without being prompted by a notification

### First month
A student at 30 days should:
- Feel their Mood Forest is uniquely theirs
- Have at least one journal entry they're glad they wrote
- Describe the app to a friend without being asked

### Project award criteria (the 90-second judge test)
A judge opening MoodMate for 90 seconds should:
- Immediately want to show it to someone else
- Be able to describe MoodMate's uniqueness in one sentence
- Not confuse it with Headspace, Calm, Wysa, or any other app

---

# PART FOUR: SIGNATURE INNOVATIONS

These are the three features that define MoodMate's originality. They are what judges remember six months later. They are what students describe to their friends. They are what makes MoodMate a product, not an app.

---

## 13. The Mood Forest

### The philosophy

Traditional gamification (XP bars, level numbers, daily mission counters) creates performance anxiety. A student who has missed three days and sees a broken streak, an XP deficit, and a missed mission doesn't feel motivated — they feel behind. Feeling behind in a mental wellness app is a product failure.

The Mood Forest replaces the performance-anxiety model with a growth-without-pressure model.

### How it works

Every act of self-care plants or nurtures something living. Not a number — an organism.

**Planting events:**
| Action | Forest effect |
|--------|--------------|
| Log any mood | A seed is planted in the soil |
| Log "Happy" | A sunflower seed |
| Log "Calm" | Soft moss appears on a stone |
| Log "Anxious" (but still showed up) | A resilient oak sapling takes root |
| Log "Grateful" | Lavender blooms |
| Complete a breathing session | All plants are watered |
| Write a journal entry | Sunlight reaches the canopy |
| Reach out in Community | A new path opens between trees |
| Complete SOS flow | A lantern appears that glows at night |

**The critical rule — plants never die.**  
If a student misses a week, their forest does not wilt, shrink, or punish them. It goes dormant — still there, still theirs, still waiting. When they return, the first action reawakens it: a leaf uncurls, a petal opens, the lantern flickers. The message: *I was waiting for you. Welcome back.*

### Visual language
- Time of day: the forest renders in morning light, afternoon warmth, evening gold, or night-time moonlight
- Seasonal shifts: spring blooms, summer fullness, autumn colors, winter rest — the forest changes with the real world
- Density: a week of daily check-ins produces visible growth; a month creates a landscape
- Uniqueness: no two forests look the same because no two emotional journeys are the same

### Replacing the current gamification face
XP, levels, badges, and streaks do not disappear. They become the *engine beneath the forest*:
- XP determines which plant species unlock
- Streaks are "days of sunlight"
- Badges are rare flora (the 7-day streak badge becomes "Lavender has bloomed")
- Daily missions are "today's garden task"
- The numbers still exist — in a detail view, not as the face of the experience

### Screen implementation
**`MoodForestScreen`** — a fullscreen, touch-explorable landscape  
- Students can pan and zoom their forest
- Tapping a plant shows when it was planted and what action created it
- A small illustrated seed/sprout (Sage, see §15) occasionally appears tending the garden
- The forest can be "shared" as a screenshot — designed to look beautiful even out of context

**Home screen integration**  
A botanical band appears beneath the greeting header — a narrow panoramic strip showing 3–4 of the student's most recent plants. Tapping it navigates to the full forest.

---

## 14. Memory Constellation

### The concept

Journal entries become stars in a personal galaxy.

The first entry is a small, dim star. Entries clustered around the same emotional themes form constellations. Entries from difficult periods form one cluster; entries from growth periods form another. Over a semester, the constellation reveals emotional patterns — not as a chart with numbers, but as a visual map of lived experience.

Students can zoom into the galaxy, tap individual stars to read past entries, and see how their constellations have grown.

### Why this is powerful

Charts reduce human experience to data. The Memory Constellation treats journal entries as *moments* — each one a point of light in a personal universe. The visualization is beautiful, private, and deeply meaningful. It answers the question "how have I grown?" in a way that no mood chart can.

### Technical approach
- Entries are rendered as circles at varying scales (longer entries = slightly larger star)
- Position is determined by emotion: a spatial mapping of the emotion wheel projected onto 2D space (so "happy" entries cluster in one region, "anxious" in another, "calm" in another)
- Connecting lines appear between entries within 7 days of each other — the "constellation" effect
- Zoom and pan via React Native gesture handler (PanGestureHandler + PinchGestureHandler)
- Entry text is readable on tap (navigates to `JournalViewScreen`)

### Emotion-to-position mapping
Using the emotion wheel as a coordinate system:
- Joy/Happy: upper right quadrant (high valence, high arousal)
- Calm/Content: upper left quadrant (high valence, low arousal)
- Sad/Low: lower left quadrant (low valence, low arousal)
- Anxious/Angry: lower right quadrant (low valence, high arousal)

Entries cluster into visible emotional neighborhoods over time. The student doesn't need to understand the coordinate system — they just see that similar-feeling entries live near each other.

---

## 15. Campus Pulse

### The concept

An anonymous, aggregate visualization of how the campus community is feeling right now.

Not individual data. Not names. Not even individual emotions. Just the collective emotional weather of all MoodMate users at this institution — visualized as a living, breathing ambient display.

### What it looks like

A softly animated abstract field — think of slow-moving northern lights, or the surface of a calm sea. The field's color reflects the aggregate mood distribution of the past 24 hours:

- Mostly calm, content check-ins: soft sage greens and warm golds
- High anxiety distribution (exam season): cool blue-greys with occasional agitated movement
- Mixed: the full palette, shifting slowly
- High happiness (end of term): warm coral and gold, brighter movement

The visualization has no numbers, no percentages, no individual attribution. Students see only: *the campus is feeling _____, and so am I.*

### Why this matters

Loneliness is one of the biggest mental health challenges for students. The feeling of "am I the only one who is struggling?" is isolating. Campus Pulse answers that question without words: *look — the whole campus feels this way right now.* You are not alone. You never were.

### Privacy architecture
- Only aggregate data is transmitted to and from the server
- Individual check-ins are never associated with Campus Pulse display data
- Data is aggregated server-side with minimum cohort sizes (no Campus Pulse if fewer than 50 users have checked in that day) to prevent inference about individuals
- Students can opt out of contributing to Campus Pulse from Profile settings

---

# PART FIVE: COMPANION AND AI

---

## 16. The Companion — "I Know This App"

### The fundamental distinction

There are two ways an app can feel personalized:

**"This app knows me"** — The app has collected data about me and uses it to serve me personalized content. This feels useful but slightly unsettling. It's a service.

**"I know this app"** — I have developed a relationship with this experience. I recognize how it communicates. I trust what it says. It feels familiar. This is a relationship.

MoodMate's AI direction is the second kind.

The companion does not collect data in a way that feels surveilled. It develops a voice and a presence that the student recognizes and grows comfortable with over time. The student knows *this companion* — its personality, its cadence, its tone — not just its content recommendations.

### The companion's character

The companion is not a chatbot. It does not have a conversation interface. It speaks through:
- The greeting on the home screen
- The prompt on the check-in screen
- The suggestion after a check-in
- The journal prompt
- The push notification (when the student opts in)
- The message after a streak milestone

Its voice is: calm, intelligent, brief. It never says more than it needs to. It never performs enthusiasm. It notices things without making the student feel watched.

### Graduated intimacy

The companion's relationship with the student deepens over time:

**Day 1–7:** The companion speaks in universal terms. *"How are you feeling today?"* It doesn't yet know anything specific.

**Day 8–30:** The companion begins to notice patterns. *"You've been checking in most evenings. How are you doing tonight?"* Not invasive — just present.

**Day 31–90:** The companion knows the student's rhythms. *"Exam season is coming up — historically a demanding time. Want to build in some extra breathing this week?"*

**Day 91+:** The companion has a history with the student. It can reference the Mood Forest, the Memory Constellation, significant milestones. *"Your forest has grown a lot since October. What changed?"*

### What the companion never does
- Never mentions specific numbers (streak counts, XP amounts) in its main communication — those belong in the gamification layer
- Never guilts, reminds, or pressures
- Never provides clinical advice
- Never breaks voice (no system messages, no error jargon)
- Never speaks more than 3 sentences at a time

---

## 17. AI Personalization Layers

### Layer 1 — Time and context (buildable now)

The app responds to when and where in the day/year the student is. All derivable from device time and academic calendar.

| Context | App adaptation |
|---------|---------------|
| Early morning (5am–9am) | Softer colors, journal-first suggestion, "gentle start" affirmations |
| Daytime (9am–5pm) | Full energy, community and explore surfaced |
| Evening (5pm–9pm) | Calm-forward, breathing and music suggested |
| Late night (9pm–2am) | Quieter UI, SOS subtly more accessible, calming music default |
| Exam season (Oct, Nov, Mar, Apr) | Breathing and grounding prioritized, "you're not alone" copy |
| Post-exam (late Apr, late Dec) | Celebration-forward, community encouraged, Proud Dandelion surfaced |

### Layer 2 — Mood pattern response (requires 3+ check-ins)

| Pattern detected | App adaptation |
|-----------------|----------------|
| Last 3 check-ins: Anxious | Home suggests Breathe and Worry Box as primary actions |
| Last 3 check-ins: Sad | Home shows "I'm here" companion message; journal prompt softens |
| Last 3 check-ins: Happy/Calm | Community surfaced; Proud Dandelion suggested |
| No check-in in 3+ days | Return greeting changes to: *"It's been a while. How are you doing?"* |
| Streak milestone (7, 30 days) | Forest has a visible growth event; companion acknowledges it quietly |

### Layer 3 — Content intelligence (requires mood + usage history)

After each check-in, the Explore tab's default order adapts:
- Anxious → Breathing Session at top
- Sad → Safe Place and journal prompt
- Happy → Community tab and music
- Calm → Ambient music and journal

Affirmation pool rotates from emotion-matched categories. Over time, affirmations shift to avoid repetition.

### Layer 4 — The full companion (future)

A persistent entity that has been shaped by a student's specific journey. Not a chatbot. Not a feed algorithm. A presence that has paid attention — and it shows.

---

# PART SIX: MOTION DESIGN

---

## 18. Motion Language

### The core character

MoodMate's motion character is **slow, organic, and weighted.** Nothing snaps. Everything arrives. The app moves the way a person moves when they are calm — not slow from laziness, but slow from presence.

### The spring taxonomy

Replace all hardcoded animation values with these named constants. Add them to the `springs` token object.

| Name | Character | Use case | Config |
|------|-----------|----------|--------|
| `snap` | Instant, tight | Button press feedback | `friction: 8, tension: 200` |
| `response` | Fast, minimal bounce | Card selection, chip toggle | `friction: 7, tension: 160` |
| `enter` | Medium, gentle bounce | Cards and modals arriving | `friction: 6, tension: 120` |
| `float` | Slow, dreamlike | Background orbs, particles | `friction: 14, tension: 50` |
| `settle` | Very slow, no bounce | Full-screen transitions | `friction: 12, tension: 40` |

### Timing constants

| Name | Value | Use |
|------|-------|-----|
| `durationFast` | 150ms | Micro-interactions, state changes |
| `durationBase` | 300ms | Standard component transitions |
| `durationSlow` | 500ms | Screen-level transitions |
| `durationBreath` | 4000ms | Breathing cycles, ambient shifts |
| `durationSeasonal` | 30000ms | Background gradient drift (imperceptible) |

### The motion principles

**Stagger:** Lists and grids never animate simultaneously. Each item enters with a 40ms offset (`timing.cardEntry`). The first item leads; the last arrives slightly after. The screen feels composed, not rendered.

**Interruption:** All animations must be interruptible. A user who taps while an animation is running should not wait for it to complete. Use `Animated.spring` with `bounciness: 0` for interruptible states.

**Weight:** Heavier visual elements move more slowly. A full-screen modal settles with `settle`. A small chip toggles with `snap`. Weight is proportional.

**Anticipation:** Elements compress slightly before expanding. A button that scales down 0.96 before scaling back to 1 on release communicates that it felt the press.

**Follow-through:** Elements slightly overshoot their destination before settling. Spring animations with `bounciness: 4–8` achieve this. Never `bounciness: 0` for entries — only for exits.

### What MoodMate motion is never
- Bouncy enough to feel playful or childish (max bounciness on entry springs: 8)
- So fast it feels mechanical
- Decorative without purpose
- Blocking user interaction
- Running when the user has enabled "Reduce Motion" in accessibility settings (always respect this system preference)

### The golden rule

**If you can feel the animation resisting you, it's too slow. If you can't feel it at all, it's too fast. Find the moment where it feels like the app is gently agreeing with what you just did.**

---

## 19. Signature Motion Moments

### Launch
The MoodMate logo blooms from the center — a spring scale from 0.3 to 1.0 with `enter` spring. Background color is time-of-day aware. Affirmation types itself character by character. Completion haptic: one gentle double-pulse.

### Check-in emotion selection
Background color transitions to emotion-matched wash over 400ms. Emotion wheel selected sector expands (scale 1.05) with soft glow border. The blob at the wheel center morphs shape subtly to reflect the emotion.

### Check-in save — the exhale
1. Button text transitions: "Log mood" → "✓ Logged" (color morphs to success green)
2. Button scale: 1.0 → 1.05 → 1.0 over 400ms
3. Background washes briefly with emotion color at 15% opacity
4. All screen content scales to 0.98 over 300ms (the "exhale")
5. Navigate back after 600ms total
6. Haptic: `hapticSuccess` at step 2

### Breathing session phase transition
Two overlapping `LinearGradient` components at `StyleSheet.absoluteFill`. When phase changes, the top gradient's opacity transitions from 0 to 1 over 800ms, beginning 300ms before the phase label changes. The student senses the environment shift before the instruction does — visual preparation.

### Mood Forest growth
When a new plant appears, it scales up from 0 with `enter` spring. A gentle shimmer (opacity pulse 1.0 → 0.6 → 1.0 over 800ms) draws the eye. The surrounding plants briefly sway — a single slow oscillation on each neighbor (translate Y ±3px over 1 second).

### Memory Constellation entry
Stars appear one by one in chronological order, each fading in over 200ms with a 50ms stagger between them. On tap, a star expands with `enter` spring and reveals the entry text via a smooth height expansion.

### SOS screen — time slows
Navigation to SOS uses a cross-fade (opacity) rather than a push or slide. Duration: 600ms. Slower than any other transition in the app. The deliberate slowness communicates: *we have time. There is no rush.*

---

# PART SEVEN: SENSORY DESIGN

---

## 20. Sound Design

### Core principle

Sound in MoodMate is always:
- Optional (user-controlled, off by default for new users)
- Quiet (designed to complement silence, not replace it)
- Warm (no clinical beeps, no harsh tones, no notification sounds)
- Purposeful (every sound has an intention)

**Silence is also a sound choice.** The most powerful sound MoodMate makes is sometimes no sound at all. When a journal entry is saved, when the SOS screen opens, when a streak is broken — silence is the appropriate response. Do not fill silence with sound.

### Sound vocabulary

| Moment | Sound character | Notes |
|--------|----------------|-------|
| App launch complete | Single warm chime, 200ms fade-out | Optional |
| Check-in saved | Ascending two-note chord, warm, 400ms | Optional |
| Breathing inhale phase | Low, slow sine tone that gradually rises | Loops for phase duration |
| Breathing exhale phase | Tone descends and fades out | End of phase |
| Breathing complete | Single shimmer tone, 3 ascending notes | One-time, post-session |
| Forest plant grows | Single warm kalimba pluck | Optional, on growth event |
| Badge / rare plant unlock | Three-note ascending shimmer | Optional |
| Journal save | Soft page-turn rustle, very quiet | Optional |
| SOS screen opens | **No sound. No haptic.** | Always silent |
| Error | **No sound.** | Use visual feedback only |

### Ambient audio (user-selectable)
- Rain (looped, 30 min before fade out)
- Forest (looped)
- Library (quiet ambience)
- Ocean (looped)
- Silence (default)

Ambient audio is a separate setting from UI sounds. Independent toggles in Profile.

---

## 21. Haptics Design Language

Match haptic weight to action weight. Lighter interactions = lighter haptics.

| Interaction | Haptic | Reason |
|-------------|--------|--------|
| Tap any card | `hapticLight` | Gentle acknowledgment |
| Toggle a goal | `hapticLight` | Lightweight state change |
| Select an emotion | `hapticSelection` | Fine-grained selection feedback |
| Complete check-in | `hapticSuccess` | Significant positive moment |
| Unlock a badge / rare plant | `hapticHeavy` then `hapticSuccess` | Two-beat: weight then celebration |
| Breathing phase change | `hapticLight` | Rhythm cue |
| Breathing session complete | `hapticSuccess` | Session milestone |
| Journal save | `hapticMedium` | Substantial act |
| SOS screen opens | **No haptic** | Calm entry, no startle |
| SOS action tapped | `hapticLight` | Gentle, not alarming |
| Error / failed save | `hapticWarning` | Clear feedback, not harsh |
| Streak milestone | `hapticHeavy` | Significant achievement |
| Forest plant grows | `hapticLight` | Quiet delight |
| Memory Constellation star tapped | `hapticLight` | Delicate navigation |
| Campus Pulse interaction | `hapticLight` | Gentle engagement |

**Never use `hapticError` in MoodMate.** The app never tells a student they've done something wrong.

---

# PART EIGHT: ILLUSTRATION AND CHARACTER

---

## 22. Mascot Direction — Sage

### Concept

Sage is a small sprout. Not a cartoon animal, not a human avatar — a living plant with gentle eyes and an expressive posture. Sage communicates through body language alone: never text, never speech bubbles, never demands.

Sage is MoodMate's quiet companion. It appears in the Mood Forest, in empty states, and in milestone moments. It never dominates a screen. It belongs in the environment, like a plant belongs in a room.

### Character alternatives (explored and considered)

Before committing to Sage, these directions were evaluated:

- **Luna** (abstract crescent moon) — More abstract, better for "reflection" metaphor, but lacks warmth for casual daily interactions
- **Bloom** (an evolving flower with no face) — Pure botanical metaphor, no anthropomorphism, but loses the relational quality that makes Sage special
- **Aura** (a color-shifting orb) — Most abstract, works well with Emotional Weather system, but doesn't belong in the Mood Forest
- **Sage** (a sprout with expressive eyes) — Warmest, most relatable, most botanically coherent with the forest metaphor. Selected.

### Sage's expression vocabulary

| State | Visual description |
|-------|--------------------|
| Resting | Gently upright, small content curve at the "mouth" edge of a leaf, slow sway |
| Happy | Leaves spread wide, leaning slightly forward, brighter green |
| Anxious | Leaves pulled inward, slightly hunched, eyes wide but soft |
| Sad | Gentle droop, one leaf hanging low, eyes downcast |
| Proud | Standing tall, leaves spread, a quiet dignity |
| Exhausted | Leaning against a small stone, eyes half-closed |
| Welcoming | One leaf extended slightly outward, as if reaching |
| Curious | Tilted slightly to one side |

### Where Sage appears

| Location | What Sage does |
|----------|----------------|
| Mood Forest | Lives here. Tends the garden. Reacts to new growth. |
| Journal empty state | Sitting with a tiny open journal, looking up at the student |
| Community empty state | Waving gently into the open space |
| Check-in first ever completion | Plants the first seed (brief 2-second animation) |
| 7-day streak milestone | Stands beside a newly bloomed flower |
| 30-day streak milestone | Forest is full; Sage is surrounded by plants |
| After breathing session | Briefly visible, taking a deep breath alongside the student |
| SOS completion | Simply, quietly waves as the student closes the screen |
| Error / offline state | Sits quietly with a gentle expression — not alarmed, just waiting |

### Illustration style rules

- **Line weight:** Thin, rounded, organic — no sharp angles
- **Color:** Drawn from the MoodMate token palette exclusively
- **Texture:** Subtle watercolor wash over flat color — not digital-flat, not hyper-realistic
- **Scale:** Always humble. Sage never dominates a layout. It exists within it.
- **Expression:** Always gentle. Sage never looks alarmed, disappointed, or demanding.
- **Movement:** Sage always moves slowly. Its idle animation is a gentle sway. Its reactions are quiet.

---

## 23. Empty States

Every empty state in MoodMate is an invitation, not an absence.

| Screen | Message | Visual |
|--------|---------|--------|
| Journal (no entries) | "Your story starts here." | Sage with a tiny open journal |
| Community (no posts today) | "Be the first voice today." | Soft concentric circles radiating outward |
| Mood History (new user) | "Check in today to start your story." | Simple calendar with one glowing dot |
| Gratitude Jar (empty) | "Drop something in." | Simple jar outline, warm light inside |
| Worry Box (empty) | "Nothing locked away. A good day." | Closed lock, surrounded by soft light |
| Mood Forest (first session) | "Your forest begins with today." | Bare ground with a single seed |
| Memory Constellation (no entries) | "Every entry becomes a star." | Empty night sky with one dim star |

---

# PART NINE: GAMIFICATION

---

## 24. Gamification Philosophy

### The governing rule

**MoodMate's gamification must reduce anxiety, not create it.**

Any feature that could cause a student to feel guilty, behind, or inadequate fails this rule and must be redesigned.

### The full framework

| Element | Purpose | How it manifests |
|---------|---------|-----------------|
| Mood Forest | Visual growth metaphor | The face of gamification |
| Streaks | Consistency celebration | "Days of sunlight" in the forest |
| XP | Growth currency | Unlocks new plant species |
| Badges | Rare flora | Appear as new plants in the forest |
| Daily missions | Gentle suggestion | "Today's garden task" |
| Levels | Ecosystem stages | Forest evolves: seedling → grove → canopy |

### The streak philosophy

Streaks celebrate. They never punish.

A broken streak is met with silence. When the student returns, MoodMate says: *"Welcome back."* The streak counter resets — but the forest remains. Nothing that grew is lost. The student's history is not erased; it's simply a period of dormancy.

**Never show a broken streak with negative visual treatment.** No red color. No "streak lost" message. No counter going to zero in a jarring way. The counter simply rests.

### The XP philosophy

XP is invisible in day-to-day use. It surfaces only:
- When a student earns a meaningful amount (milestone moments)
- In the Profile screen, as a historical record
- As the engine determining which plants unlock (never stated as "earn XP to unlock")

Students should never feel like they are grinding for XP. They should feel like they are caring for their forest — and occasionally, something new blooms.

---

# PART TEN: IMPLEMENTATION STANDARDS

---

## 25. Component Architecture Rules

### File organization
Every component must be in its own file. No inline component definitions in screen files. (Exception: very small sub-components under 20 lines that are never reused, annotated with `// local-only`.)

### Naming conventions
- Screens: `[Name]Screen.tsx` — e.g., `CheckInScreen.tsx`
- Components: `[Name].tsx` — e.g., `MoodForestCard.tsx`
- Stores: `use[Name]Store.ts` — e.g., `useForestStore.ts`
- Utilities: `[name].ts` — e.g., `haptics.ts`

### Color usage rules
1. All colors come from the token system (`colors`, `gradients`, `glass`, `glow`, `semantic`)
2. No hardcoded hex values anywhere in the codebase — zero exceptions
3. If a color is needed that doesn't exist in tokens, add it to tokens first

### Font usage rules
1. All fontFamily values come from `fonts` token
2. All fontSize values come from `fontSizes` token
3. No hardcoded numeric font sizes — zero exceptions

### Animation rules
1. All spring configurations come from `springs` token
2. All durations come from `timing` or `motion` token
3. `useNativeDriver: true` for: transform, opacity
4. `useNativeDriver: false` for: layout properties (width, height, borderRadius, backgroundColor)
5. The same `Animated.Value` must never be used with both native and JS driver

### Accessibility rules (non-negotiable)
Every interactive element must have:
```tsx
accessibilityRole="button" // or appropriate role
accessibilityLabel="[descriptive label]"
accessibilityHint="[what happens when activated]" // optional but preferred
```

Every text element that is significant must have:
```tsx
accessibilityRole="text"
```

Touch targets: minimum 44×44pt enforced via `minHeight: 44, minWidth: 44` or equivalent padding.

---

## 26. Performance Rules

1. **No `setInterval` without cleanup.** Every `useRef` interval must be cleared in the `useEffect` return function.

2. **`useMemo` for expensive derivations.** Any value derived from data in a render function must be memoized if the derivation is non-trivial.

3. **`useCallback` for event handlers passed to children.** Prevents unnecessary child re-renders.

4. **No module-level side effects.** No audio players, no `setInterval`, no `Date.now()` at module scope. All of these belong inside hooks.

5. **`FlatList` for lists of more than 8 items.** `ScrollView` with mapped children is acceptable for short lists; `FlatList` with `keyExtractor` for anything longer.

6. **Image assets must be optimized.** All PNGs under 200kb. Illustrations rendered as SVG where possible.

7. **Respect system accessibility settings.** Check `AccessibilityInfo.isReduceMotionEnabled()` and disable or simplify animations accordingly.

---

## 27. Implementation Sequence

This is the order in which implementation proceeds. No step begins before the previous is approved.

### Stage A — P0 Fixes (no design change)
1. Wire SOS grounding button → `GroundingScreen`
2. Wire SOS counsellor button → support/counsellor flow
3. Fix Explore stretch timer cleanup on unmount
4. Fix gameSub and slider tick font sizes to minimum 12px
5. Remove MoodGate 600ms timeout

### Stage B — Design System Enforcement
6. Replace all hardcoded hex values with tokens
7. Replace all hardcoded animation values with token spring presets
8. Add `accessibilityLabel` and `accessibilityRole` to all interactive elements across all primary screens
9. Fix all touch targets to 44pt minimum
10. Add `splash.png` asset or remove from `app.json`

### Stage C — Home Screen Hierarchy
11. Elevate Check-In as primary CTA (full-width card, floating elevation, pulse animation)
12. Collapse gamification stack into expandable "Your Progress" card
13. Add botanical band showing Mood Forest preview beneath header

### Stage D — Signature Innovations
14. Build `MoodForestScreen` — the Mood Forest visualization
15. Replace `WellnessTreeScreen` with Mood Forest
16. Build `MemoryConstellationScreen` — star map of journal entries
17. Add Campus Pulse to Community screen

### Stage E — Experience Polish
18. Check-in emotional color response (background shifts with emotion)
19. Check-in save exhale animation
20. Breathing session gradient morph between phases
21. SOS screen deep-blue redesign with large ring
22. Explore screen tab navigation (Music | Mindful | Activities)

### Stage F — AI Personalization
23. Time-of-day companion voice
24. Mood pattern detection and response
25. Exam season awareness
26. Affirmation pool categorization and emotion-matching

### Stage G — Sensory Layer
27. Sound design implementation (optional sounds via `expo-audio`)
28. Haptics language enforcement audit across all screens
29. Ambient audio option in Explore/Journal

### Stage H — Sage and Illustrations
30. Commission or create Sage character artwork
31. Implement all empty states with Sage illustrations
32. Mood Forest botanical illustrations

---

# APPENDIX: QUICK REFERENCE

---

## The Design Bible in Ten Sentences

1. MoodMate makes students feel lighter, seen, and like someone is on their side.
2. The app behaves like the senior friend every first-year student wishes they had.
3. Never punish. Only encourage.
4. Motion communicates care — every animation is a statement about how the app treats people.
5. Color responds to emotional context, not just brand guidelines.
6. The Mood Forest grows with you — it never punishes you for being away.
7. Your journal entries are stars in a personal constellation.
8. The campus is feeling this too — you are not alone.
9. Silence is sometimes the most respectful response.
10. Nothing ships unless a student in distress could use it in 10 seconds.

---

## The Quality Gate (Quick Reference)

Before any screen ships:
- [ ] Purpose clear in 3 seconds?
- [ ] Primary action visually dominant?
- [ ] Every animation purposeful?
- [ ] Anything removable?
- [ ] Feels like the same app as every other screen?
- [ ] Reduces anxiety, not creates it?
- [ ] All text ≥ 12px? All targets ≥ 44pt? All interactives labeled?
- [ ] Aligns with the north star: *lighter, seen, supported*?

---

## The Brand Test (Quick Reference)

Any copy, color, animation, feature, or screen must pass:

- [ ] Does this feel gentle but not soft?
- [ ] Does this feel encouraging but not toxic-positive?
- [ ] Does this feel student-first?
- [ ] Would the senior friend say this?
- [ ] Does this make the student feel lighter, seen, and supported?

If any answer is No — redesign.

---

*End of MoodMate Design Bible v1.0*  
*All future features must be reviewed against this document before implementation begins.*
